const express = require('express');
const router = express.Router();

let wire = null;

function DBconnect(val){
  wire = val;
}

// Fallback user for anonymous comments (must exist in `users`)
const ANON_USER_ID = 'u0-anon';
const ANON_USER_NAME = 'Anonymous';
const ANON_USER_IMG = null; // or a default avatar url

async function ensureAnonUser() {
  // create the anon user if not exists
  await wire.query(
    `INSERT IGNORE INTO users (user_id, user_name, img) VALUES (?, ?, ?)`,
    [ANON_USER_ID, ANON_USER_NAME, ANON_USER_IMG]
  );
}

function CommentTree(comments) {
  const map = {};
  const roots = [];
  comments.forEach(c => (map[c.comment_id] = { ...c, children: [] }));
  comments.forEach(c => {
    if (c.parent_comment_id && map[c.parent_comment_id]) {
      map[c.parent_comment_id].children.push(map[c.comment_id]);
    } else {
      roots.push(map[c.comment_id]);
    }
  });
  const byTime = (a, b) => new Date(a.created_at) - new Date(b.created_at);
  roots.sort(byTime);
  const sortChildren = (n) => {
    if (!n.children?.length) return;
    n.children.sort(byTime);
    n.children.forEach(sortChildren);
  };
  roots.forEach(sortChildren);
  return roots;
}

/* ===== BLOG comments (threaded) ===== */
router.get('/blog/:blog_id', async (req, res) => {
  try {
    const [rows] = await wire.query(
      `SELECT c.*, u.user_name, u.img
         FROM comment c
         LEFT JOIN users u ON c.user_id = u.user_id
        WHERE c.blog_id = ?
        ORDER BY c.created_at ASC`,
      [req.params.blog_id]
    );
    res.json({ message: "getblog", comment: CommentTree(rows) });
  } catch (error) {
    console.error("❌ Fetch blog comments error:", error);
    res.status(500).json({ error: error.message || "can't fetch blog comment" });
  }
});

/* ===== NOTE comments (threaded) ===== */
router.get('/note/:note_id', async (req, res) => {
  try {
    const [rows] = await wire.query(
      `SELECT c.*, u.user_name, u.img
         FROM comment c
         LEFT JOIN users u ON c.user_id = u.user_id
        WHERE c.note_id = ?
        ORDER BY c.created_at ASC`,
      [req.params.note_id]
    );
    res.json({ message: "getnote", comment: CommentTree(rows) });
  } catch (error) {
    console.error("❌ Fetch note comments error:", error);
    res.status(500).json({ error: error.message || "can't fetch note comment" });
  }
});

/* ===== CREATE comment (supports anonymous via u0-anon) ===== */
router.post('/', async (req, res) => {
  try {
    const { user_id, message, blog_id, note_id, parent_comment_id } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ error: 'message is required' });
    }
    if (!blog_id && !note_id) {
      return res.status(400).json({ error: 'blog_id or note_id is required' });
    }

    // If no user_id provided → use anonymous fallback
    const actualUser =
      typeof user_id === 'string' && user_id.trim() !== ''
        ? user_id.trim()
        : ANON_USER_ID;

    // Ensure the user exists (creates u0-anon once)
    await ensureAnonUser();

    if (actualUser !== ANON_USER_ID) {
      const [[u]] = await wire.query(
        'SELECT user_id FROM users WHERE user_id = ? LIMIT 1',
        [actualUser]
      );
      if (!u) {
        return res.status(400).json({ error: `invalid user_id: ${actualUser}` });
      }
    }

    const [result] = await wire.query(
      `INSERT INTO comment (user_id, message, blog_id, note_id, parent_comment_id)
       VALUES (?, ?, ?, ?, ?)`,
      [actualUser, message.trim(), blog_id ?? null, note_id ?? null, parent_comment_id ?? null]
    );

    return res.json({
      message: 'Comment added successfully',
      insertedId: result.insertId,
      isAnonymous: actualUser === ANON_USER_ID,
    });
  } catch (error) {
    console.error("❌ Add comment error:", error);
    return res.status(500).json({ error: error.message || 'Failed to add comment' });
  }
});

/* ===== UPDATE comment (bumps updated_at) ===== */
router.put('/:id', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message?.trim()) {
      return res.status(400).json({ error: 'message is required' });
    }
    const [result] = await wire.query(
      `UPDATE comment
          SET message = ?, updated_at = NOW()
        WHERE comment_id = ?`,
      [message.trim(), req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'comment not found' });
    }
    res.json({ message: 'updatesuccess' });
  } catch (error) {
    console.error("❌ Update comment error:", error);
    res.status(500).json({ error: 'Failed to update comment' });
  }
});

module.exports = { router, DBconnect };

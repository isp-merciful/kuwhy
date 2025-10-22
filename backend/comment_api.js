const express = require('express');
const router = express.Router();

let wire = null;
function DBconnect(val){ wire = val; }

// fallback anonymous user (FK-friendly)
const ANON_USER_ID = 'u0-anon';
const ANON_USER_NAME = 'Anonymous';
const ANON_USER_IMG = null;

async function ensureAnonUser() {
  await wire.query(
    `INSERT IGNORE INTO users (user_id, user_name, img) VALUES (?, ?, ?)`,
    [ANON_USER_ID, ANON_USER_NAME, ANON_USER_IMG]
  );
}

function CommentTree(rows) {
  const byId = new Map();
  const roots = [];

  for (const r of rows) {
    byId.set(r.comment_id, {
      comment_id: r.comment_id,
      user_id: r.user_id,
      user_name: r.user_name ?? 'Anonymous',
      img: r.img,
      message: r.message,
      blog_id: r.blog_id,
      note_id: r.note_id,
      parent_comment_id: r.parent_comment_id,
      created_at: r.created_at,
      updated_at: r.updated_at,
      children: []
    });
  }

  for (const r of rows) {
    const node = byId.get(r.comment_id);
    if (r.parent_comment_id && byId.has(r.parent_comment_id)) {
      byId.get(r.parent_comment_id).children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortFn = (a, b) => new Date(a.created_at) - new Date(b.created_at);
  const sortRecursive = (arr) => {
    arr.sort(sortFn);
    arr.forEach((n) => n.children?.length && sortRecursive(n.children));
  };
  sortRecursive(roots);
  return roots;
}

/* Create comment (strict identity: either anon or explicit user_id) */
router.post('/', async (req, res) => {
  try {
    let { user_id, isAnonymous, message, blog_id, note_id, parent_comment_id } = req.body;

    if (!message?.trim()) return res.status(400).json({ error: 'message is required' });
    if (!blog_id && !note_id) return res.status(400).json({ error: 'blog_id or note_id is required' });

    await ensureAnonUser();

    // Decide actual user
    let actualUser;
    if (isAnonymous === true) {
      actualUser = ANON_USER_ID;
    } else if (typeof user_id === 'string' && user_id.trim() !== '') {
      actualUser = user_id.trim();
      // Ensure provided guest user exists (FK safety)
      await wire.query(
        "INSERT INTO users (user_id, user_name) VALUES (?, ?) ON DUPLICATE KEY UPDATE user_name = VALUES(user_name)",
        [actualUser, "Guest"]
      );
    } else {
      return res.status(400).json({ error: "Provide user_id or set isAnonymous: true" });
    }

    const [result] = await wire.query(
      `INSERT INTO comment (user_id, message, blog_id, note_id, parent_comment_id)
       VALUES (?, ?, ?, ?, ?)`,
      [actualUser, message.trim(), blog_id ?? null, note_id ?? null, parent_comment_id ?? null]
    );

    res.json({ message: 'Comment added successfully', insertedId: result.insertId, isAnonymous: actualUser === ANON_USER_ID });
  } catch (error) {
    console.error("❌ Add comment error:", error);
    res.status(500).json({ error: error.message || "can't add comment" });
  }
});

router.get('/', async (req, res) => {
  try {
    const [result] = await wire.query(`SELECT * FROM comment`);
    res.json({ message: "getallcomment", comment: CommentTree(result) });
  } catch (error) {
    console.error("❌ Fetch error:", error);
    res.status(500).json({ error: error.message, message: "can't fetch note comment" });
  }
});

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

router.delete('/:id', async(req,res) => {
  try{
    await wire.query('DELETE FROM comment WHERE comment_id = ?', [req.params.id]);
    res.json('delete success');
  }catch(error){
    console.error(error);
    res.status(500).json({ error:"can't delete comment" });
  }
});

module.exports = { router, DBconnect };


// backend/comment_api.js
const express = require("express");
const { prisma } = require('./lib/prisma.cjs');
const router = express.Router();

// --------- helper: build comment tree ----------
function CommentTree(comments) {
  const map = {};
  const roots = [];

  comments.forEach(c => { map[c.comment_id] = { ...c, children: [] }; });

  comments.forEach(c => {
    if (c.parent_comment_id) {
      if (map[c.parent_comment_id]) {
        map[c.parent_comment_id].children.push(map[c.comment_id]);
      }
    } else {
      roots.push(map[c.comment_id]);
    }
  });

  // sort by created_at asc
  const byTimeAsc = (a, b) => new Date(a.created_at) - new Date(b.created_at);
  roots.sort(byTimeAsc);
  const sortChildren = (node) => {
    if (!node.children?.length) return;
    node.children.sort(byTimeAsc);
    node.children.forEach(sortChildren);
  };
  roots.forEach(sortChildren);
  return roots;
}

// --------- GET /api/comment -----------
router.get("/", async (req, res) => {
  try {
    const flat = req.query.flat === '1';

    const comments = await prisma.comment.findMany({
      include: {
        users: { select: { user_id: true, user_name: true, img: true } }
      },
      orderBy: { created_at: "asc" }
    });

    if (flat) {
      return res.json({ message: "getallcomment_flat", comment: comments });
    }

    const commentTree = CommentTree(comments);
    res.json({ message: "getallcomment", comment: commentTree });
  } catch (error) {
    console.error("❌ Fetch error:", error);
    res.status(500).json({ error: error.message, message: "can't fetch comment" });
  }
});

// --------- GET /api/comment/note/:note_id ----------
router.get("/note/:note_id", async (req, res) => {
  try {
    const noteId = parseInt(req.params.note_id, 10);
    const flat = req.query.flat === '1';

    const comments = await prisma.comment.findMany({
      where: { note_id: noteId },
      include: {
        users: { select: { user_id: true, user_name: true, img: true } }
      },
      orderBy: { created_at: "asc" }
    });

    if (flat) {
      return res.json({ message: "getnote_flat", comment: comments });
    }

    const commentTree = CommentTree(comments);
    res.json({ message: "getnote", comment: commentTree });
  } catch (error) {
    console.error("❌ Fetch error:", error);
    res.status(500).json({ error: error.message, message: "can't fetch note comment" });
  }
});

// --------- POST /api/comment ----------
router.post("/", async (req, res) => {
  try {
    const { user_id, message, blog_id, note_id, parent_comment_id } = req.body;

    if (!user_id || !message) {
      return res.status(400).json({ error: "missing user_id or message" });
    }

    const newComment = await prisma.comment.create({
      data: {
        users: { connect: { user_id } },
        message,
        blog: blog_id ? { connect: { blog_id } } : undefined,
        note: note_id ? { connect: { note_id } } : undefined,
        // ✅ FIX: ใช้ scalar ตรง ๆ แทน parent_comment: {...}
        parent_comment_id: parent_comment_id ?? null,
      },
    });

    res.json({ message: "add comment successful", comment: newComment });
  } catch (error) {
    console.error("❌ add comment error:", error);
    res.status(500).json({ error: error.message, message: "add comment fail" });
  }
});

// --------- PUT /api/comment ----------
router.put("/", async (req, res) => {
  try {
    const { message, comment_id } = req.body;
    await prisma.comment.update({ where: { comment_id }, data: { message } });
    res.json({ message: "updatesuccess" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update comment" });
  }
});

// --------- DELETE /api/comment/:id ----------
router.delete("/:id", async (req, res) => {
  try {
    const commentId = parseInt(req.params.id, 10);
    await prisma.comment.delete({ where: { comment_id: commentId } });
    res.json("delete success");
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "can't deleted" });
  }
});

module.exports = router;

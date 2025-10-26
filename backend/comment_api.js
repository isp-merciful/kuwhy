const express = require("express");
const { prisma } = require('../lib/prisma.cjs');
const router = express.Router();

function CommentTree(comments) {
  const map = {};
  const roots = [];

  comments.forEach(c => {
    map[c.comment_id] = { ...c, children: [] };
  });

  comments.forEach(c => {
    if (c.parent_comment_id) {
      if (map[c.parent_comment_id]) {
        map[c.parent_comment_id].children.push(map[c.comment_id]);
      }
    } else {
      roots.push(map[c.comment_id]);
    }
  });

  roots.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  function sortChildren(node) {
    if (!node.children || node.children.length === 0) return;
    node.children.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    node.children.forEach(sortChildren);
  }

  roots.forEach(sortChildren);
  return roots;
}


router.get("/", async (req, res) => {
  try {
    const comments = await prisma.comment.findMany({
      include: {
        users: { select: { user_id: true, user_name: true, img: true } }
      },
      orderBy: { created_at: "asc" }
    });

    const commentTree = CommentTree(comments);

    res.json({ message: "getallcomment", comment: commentTree });
  } catch (error) {
    console.error("❌ Fetch error:", error);
    res.status(500).json({
      error: error.message,
      message: "can't fetch comment"
    });
  }
});


router.get("/note/:note_id", async (req, res) => {
  try {
    const noteId = parseInt(req.params.note_id, 10);

    const comments = await prisma.comment.findMany({
      where: { note_id: noteId },
      include: {
        users: { select: { user_id: true, user_name: true, img: true } }
      },
      orderBy: { created_at: "asc" }
    });

    const commentTree = CommentTree(comments);

    res.json({ message: "getnote", comment: commentTree });
  } catch (error) {
    console.error("❌ Fetch error:", error);
    res.status(500).json({
      error: error.message,
      message: "can't fetch note comment"
    });
  }
});


router.post("/", async (req, res) => {
  try {
    const { user_id, message, blog_id, note_id, parent_comment_id } = req.body;

    if (!user_id || !message) {
      return res.status(400).json({ error: "ไม่มี notes หรือ username" });
    }

    const newComment = await prisma.comment.create({
      data: {
        users: { connect: { user_id: user_id } },
        message,
        blog: blog_id ? { connect: { blog_id: blog_id } } : undefined,
        note: note_id ? { connect: { note_id: note_id } } : undefined,
        parent_comment: parent_comment_id
          ? { connect: { comment_id: parent_comment_id } }
          : undefined,
      },
    });

    res.json({ message: "add comment successful", comment: newComment });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: error.message,
      message: "add comment fail",
    });
  }
});


router.put("/", async (req, res) => {
  try {
    const { message, comment_id } = req.body;

    await prisma.comment.update({
      where: { comment_id: comment_id },
      data: { message },
    });

    res.json({ message: "updatesuccess" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update comment" });
  }
});


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

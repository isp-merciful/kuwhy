const express = require("express");
const { prisma } = require("./lib/prisma.cjs");
const router = express.Router();

/* ------------------------- build a nested comment tree ------------------------- */
function CommentTree(comments) {
  const map = {};
  const roots = [];

  // เตรียมโหนด
  comments.forEach((c) => {
    map[c.comment_id] = { ...c, children: [] };
  });

  // จัด parent → children
  comments.forEach((c) => {
    if (c.parent_comment_id) {
      if (map[c.parent_comment_id]) {
        map[c.parent_comment_id].children.push(map[c.comment_id]);
      }
    } else {
      roots.push(map[c.comment_id]);
    }
  });

  // sort ตามเวลา (เก่า→ใหม่)
  roots.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  function sortChildren(node) {
    if (!node.children || node.children.length === 0) return;
    node.children.sort(
      (a, b) => new Date(a.created_at) - new Date(b.created_at)
    );
    node.children.forEach(sortChildren);
  }
  roots.forEach(sortChildren);

  return roots;
}

/* --------------------------------------------
   GET /api/comment     (โหลดทั้งหมด)
--------------------------------------------- */
router.get("/", async (req, res) => {
  try {
    const rows = await prisma.comment.findMany({
      orderBy: { created_at: "asc" },
      include: {
        users: { select: { user_id: true, user_name: true, img: true } },
      },
    });

    // map ให้มี user_name, img เหมือน SQL เดิม
    const flat = rows.map((r) => ({
      ...r,
      user_name: r.users?.user_name ?? null,
      img: r.users?.img ?? null,
    }));

    const tree = CommentTree(flat);
    res.json({ message: "getallcomment", comment: tree });
  } catch (error) {
    console.error("❌ Fetch error:", error);
    res
      .status(500)
      .json({ error: error.message, message: "can't fetch note comment" });
  }
});

/* --------------------------------------------
   GET /api/comment/note/:note_id
--------------------------------------------- */
router.get("/note/:note_id", async (req, res) => {
  try {
    const noteId = Number(req.params.note_id);

    const rows = await prisma.comment.findMany({
      where: { note_id: noteId },
      orderBy: { created_at: "asc" },
      include: {
        users: { select: { user_id: true, user_name: true, img: true } },
      },
    });

    const flat = rows.map((r) => ({
      ...r,
      user_name: r.users?.user_name ?? null,
      img: r.users?.img ?? null,
    }));

    const tree = CommentTree(flat);
    res.json({ message: "getnote", comment: tree });
  } catch (error) {
    console.error("❌ Fetch error:", error);
    res
      .status(500)
      .json({ error: error.message, message: "can't fetch note comment" });
  }
});

/* --------------------------------------------
   (ถ้ามี) GET /api/comment/blog/:blog_id
--------------------------------------------- */
router.get("/blog/:blog_id", async (req, res) => {
  try {
    const blogId = Number(req.params.blog_id);

    const rows = await prisma.comment.findMany({
      where: { blog_id: blogId },
      orderBy: { created_at: "asc" },
      include: {
        users: { select: { user_id: true, user_name: true, img: true } },
      },
    });

    const flat = rows.map((r) => ({
      ...r,
      user_name: r.users?.user_name ?? null,
      img: r.users?.img ?? null,
    }));

    const tree = CommentTree(flat);
    res.json({ message: "getblog", comment: tree });
  } catch (error) {
    console.error("❌ Fetch error:", error);
    res
      .status(500)
      .json({ error: error.message, message: "can't fetch blog comment" });
  }
});

/* --------------------------------------------
   POST /api/comment
   body: { user_id, message, note_id?, blog_id?, parent_comment_id? }
--------------------------------------------- */
router.post("/", async (req, res) => {
  try {
    const { user_id, message, blog_id, note_id, parent_comment_id } = req.body;

    if (!user_id || !message) {
      return res.status(400).json({ error: "user_id และ message จำเป็น" });
    }

    const newComment = await prisma.comment.create({
      data: {
        // สำคัญ! user_id ต้องเป็น STRING 36 ตัว (UUID) ตาม schema
        user_id: String(user_id),

        message: String(message),

        // note_id / blog_id เป็น Int? ใน schema → แปลงเป็น Number หรือ null
        note_id:
          note_id !== undefined && note_id !== null && note_id !== ""
            ? Number(note_id)
            : null,

        blog_id:
          blog_id !== undefined && blog_id !== null && blog_id !== ""
            ? Number(blog_id)
            : null,

        // parent_comment_id เป็น Int?
        parent_comment_id:
          parent_comment_id !== undefined &&
          parent_comment_id !== null &&
          parent_comment_id !== ""
            ? Number(parent_comment_id)
            : null,
      },
      select: { comment_id: true, user_id: true, message: true, created_at: true },
    });

    res.json({ message: "add comment successful", comment: newComment });
  } catch (error) {
    console.error("❌ add comment error:", error);
    res.status(500).json({ error: error.message || "Prisma create comment failed" });
  }
});
/* --------------------------------------------
   PUT /api/comment
   body: { comment_id, message }
--------------------------------------------- */
router.put("/", async (req, res) => {
  try {
    const { message, comment_id } = req.body;

    if (!comment_id) {
      return res.status(400).json({ error: "ต้องมี comment_id" });
    }

    await prisma.comment.update({
      where: { comment_id: Number(comment_id) },
      data: { message },
    });

    res.json({ message: "updatesuccess" });
  } catch (err) {
    console.error("❌ update error:", err);
    res.status(500).json({ error: "Failed to update comment" });
  }
});

/* --------------------------------------------
   DELETE /api/comment/:id
--------------------------------------------- */
router.delete("/:id", async (req, res) => {
  try {
    const commentId = Number(req.params.id);
    await prisma.comment.delete({ where: { comment_id: commentId } });
    // ถ้า schema ตั้ง onDelete: Cascade ไว้ จะลบลูก ๆ ให้อัตโนมัติ
    res.json("delete success");
  } catch (error) {
    console.error("❌ delete error:", error);
    res.status(500).json({ error: "can't deleted" });
  }
});

module.exports = router;
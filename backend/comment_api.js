const express = require("express");
const { prisma } = require("./lib/prisma.cjs");
const { ensureNotPunished } = require("./punish_mw");

const router = express.Router();

/* ------------------------- simple in-memory rate limiter ------------------------- */

const commentRateStore = new Map();

const COMMENT_MIN_INTERVAL_MS = 5000;   // 5 วินาที
const COMMENT_BURST_WINDOW_MS = 60000;  // 60 วินาที
const COMMENT_BURST_LIMIT = 10;         // สูงสุด 10 คอมเมนต์ / นาที ต่อ user/ip

function getRateKey(req, userId) {
  const u = userId && String(userId).trim();
  if (u) return `u:${u}`;

  const ip =
    req.ip ||
    req.headers["x-forwarded-for"] ||
    (req.connection && req.connection.remoteAddress) ||
    "unknown";

  return `ip:${ip}`;
}

function checkCommentRateLimit(req, userId) {
  const key = getRateKey(req, userId);
  const now = Date.now();

  let rec = commentRateStore.get(key);
  if (!rec) {
    rec = { history: [] };
  }

  // ล้าง timestamps เก่าเกิน 60 วินาที
  rec.history = rec.history.filter((ts) => now - ts < COMMENT_BURST_WINDOW_MS);

  const lastTs = rec.history.length ? rec.history[rec.history.length - 1] : null;

  // 1) กันยิงติดกันเร็วเกินไป
  if (lastTs && now - lastTs < COMMENT_MIN_INTERVAL_MS) {
    const remainMs = COMMENT_MIN_INTERVAL_MS - (now - lastTs);
    const remainSec = Math.max(1, Math.ceil(remainMs / 1000));
    commentRateStore.set(key, rec);
    return {
      ok: false,
      code: "COMMENT_RATE_LIMIT",
      message: `You are commenting too fast. Please wait a moment.`,
      retryAfter: remainSec,
    };
  }

  // 2) กัน burst 10 คอมเมนต์ใน 60 วินาที
  if (rec.history.length >= COMMENT_BURST_LIMIT) {
    const oldest = rec.history[0];
    const remainMs = COMMENT_BURST_WINDOW_MS - (now - oldest);
    const remainSec = Math.max(1, Math.ceil(remainMs / 1000));
    commentRateStore.set(key, rec);
    return {
      ok: false,
      code: "COMMENT_BURST_LIMIT",
      message:
        `You have posted too many comments in a short time. ` +
        `Please wait ${remainSec}s and try again.`,
      retryAfter: remainSec,
    };
  }

  // ✅ ผ่าน → บันทึก timestamp แล้วอนุญาตให้คอมเมนต์
  rec.history.push(now);
  commentRateStore.set(key, rec);

  return { ok: true };
}

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
    node.children.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    node.children.forEach(sortChildren);
  }
  roots.forEach(sortChildren);

  return roots;
}

/* --------------------------------------------
   GET /api/comment     (โหลดทั้งหมด)
--------------------------------------------- */
router.get("/", async (_req, res) => {
  try {
    const rows = await prisma.comment.findMany({
      orderBy: { created_at: "asc" },
      include: {
        users: {
          select: { user_id: true, user_name: true, img: true, login_name: true },
        },
      },
    });

    const flat = rows.map((r) => ({
      ...r,
      user_name: r.users?.user_name ?? null,
      img: r.users?.img ?? null,
      login_name: r.users?.login_name ?? null,
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
        users: {
          select: { user_id: true, user_name: true, img: true, login_name: true },
        },
      },
    });

    const flat = rows.map((r) => ({
      ...r,
      user_name: r.users?.user_name ?? null,
      img: r.users?.img ?? null,
      login_name: r.users?.login_name ?? null,
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
   GET /api/comment/blog/:blog_id
--------------------------------------------- */
router.get("/blog/:blog_id", async (req, res) => {
  try {
    const blogId = Number(req.params.blog_id);

    const rows = await prisma.comment.findMany({
      where: { blog_id: blogId },
      orderBy: { created_at: "asc" },
      include: {
        users: {
          select: { user_id: true, user_name: true, img: true, login_name: true },
        },
      },
    });

    const flat = rows.map((r) => ({
      ...r,
      user_name: r.users?.user_name ?? null,
      img: r.users?.img ?? null,
      login_name: r.users?.login_name ?? null,
    }));

    const tree = CommentTree(flat);
    res.json({ message: "getblog", comment: tree });
  } catch (error) {
    console.error("❌ Fetch blog comments error:", error);
    res
      .status(500)
      .json({ error: error.message || "can't fetch blog comment" });
  }
});

/* --------------------------------------------
   POST /api/comment
   body: { user_id, message, note_id?, blog_id?, parent_comment_id? }

   - anonymous / member ใช้เส้นนี้เหมือนกัน
   - blog comment:
       * ต้อง login (มี Authorization header)
       * user นั้นต้องมี login_name (ตั้งชื่อแล้ว)
   - punish_mw จะใช้ user_id ใน body เพื่อเช็ค timeout/ban
--------------------------------------------- */
router.post("/", ensureNotPunished, async (req, res) => {
  try {
    const { user_id, message, blog_id, note_id, parent_comment_id } =
      req.body || {};

    if (!user_id || !message) {
      return res
        .status(400)
        .json({ error: "user_id และ message จำเป็น", error_code: "MISSING_FIELDS" });
    }

    const hasBlogId =
      blog_id !== undefined && blog_id !== null && blog_id !== "";

    // 🔒 blog comment ต้อง login + มี login_name
    if (hasBlogId) {
      // 1) ต้องมี Authorization header (login เท่านั้น)
      if (!req.headers.authorization) {
        return res.status(401).json({
          error: "Login is required to comment on blogs.",
          error_code: "LOGIN_REQUIRED_FOR_BLOG_COMMENT",
        });
      }

      // 2) เช็คว่า user นี้มี login_name จริงไหม
      const user = await prisma.users.findUnique({
        where: { user_id: String(user_id) },
        select: { login_name: true },
      });

      const loginName = user && user.login_name && String(user.login_name).trim();

      if (!loginName) {
        return res.status(403).json({
          error: "You must set your login name before commenting on blogs.",
          error_code: "LOGIN_NAME_REQUIRED_FOR_BLOG_COMMENT",
        });
      }
    }

    // ✅ กันบอทยิง / กันสแปม: เช็ค rate limit ก่อนสร้าง comment
    const rate = checkCommentRateLimit(req, String(user_id));
    if (!rate.ok) {
      return res.status(429).json({
        error: rate.message,
        error_code: rate.code,
        retry_after: rate.retryAfter,
      });
    }

    const newComment = await prisma.comment.create({
      data: {
        user_id: String(user_id),
        message: String(message),
        note_id:
          note_id !== undefined && note_id !== null && note_id !== ""
            ? Number(note_id)
            : null,
        blog_id: hasBlogId ? Number(blog_id) : null,
        parent_comment_id:
          parent_comment_id !== undefined &&
          parent_comment_id !== null &&
          parent_comment_id !== ""
            ? Number(parent_comment_id)
            : null,
      },
      select: {
        comment_id: true,
        user_id: true,
        message: true,
        created_at: true,
      },
    });

    res.json({ message: "add comment successful", comment: newComment });
  } catch (error) {
    console.error("❌ add comment error:", error);
    res
      .status(500)
      .json({ error: error.message || "Prisma create comment failed" });
  }
});

/* --------------------------------------------
   PUT /api/comment/:id
--------------------------------------------- */
router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { message } = req.body || {};

    if (!id)
      return res
        .status(400)
        .json({ error: "ต้องมี comment_id (จาก params)", error_code: "MISSING_ID" });

    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        error: "message ต้องเป็นข้อความที่ไม่ว่าง",
        error_code: "INVALID_MESSAGE",
      });
    }

    await prisma.comment.update({
      where: { comment_id: id },
      data: { message: String(message.trim()) },
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
    res.json({ message: "delete success" });
  } catch (error) {
    console.error("❌ delete error:", error);
    res.status(500).json({ error: "can't deleted" });
  }
});

module.exports = router;

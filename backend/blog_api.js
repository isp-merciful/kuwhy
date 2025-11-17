// backend/blog_api.js
const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { optionalAuth, requireMember } = require("./auth_mw");
const { prisma } = require("./lib/prisma.cjs");

/* ----------------------- Upload folder ----------------------- */

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safe = Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
    cb(null, safe);
  },
});
const upload = multer({ storage });

function filesToAttachments(files = []) {
  return files.map((f) => ({
    url: `/uploads/${f.filename}`,
    name: f.originalname,
    type: f.mimetype,
    size: f.size,
  }));
}

// helper: normalize tags
function normalizeTags(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw
      .map((t) => String(t).trim())
      .filter((t) => t.length > 0);
  }
  if (typeof raw === "string") {
    return raw
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
  }
  return [];
}

// helper: map prisma blog -> API shape
function mapBlog(b) {
  return {
    blog_id: b.blog_id,
    blog_title: b.blog_title,
    message: b.message,
    img: b.users?.img || null,
    user_name: b.users?.user_name || "anonymous",
    user_id: b.user_id,
    created_at: b.created_at,
    attachments: Array.isArray(b.attachments) ? b.attachments : [],
    blog_up: b.blog_up ?? 0,
    blog_down: b.blog_down ?? 0,
    tags: Array.isArray(b.tags) ? b.tags : [],
  };
}

/* ----------------------- CREATE BLOG ----------------------- */

router.post(
  "/",
  requireMember,
  upload.array("attachments", 10),
  async (req, res) => {
    try {
      const { blog_title, message, tags: rawTags } = req.body || {};
      const userId = req.user?.id;

      if (!userId || typeof userId !== "string") {
        return res.status(400).json({ error: "Invalid user id" });
      }

      if (!blog_title || !message) {
        return res.status(400).json({ error: "Missing fields" });
      }

      const tags = normalizeTags(rawTags);
      const uploaded = filesToAttachments(req.files);

      console.log("Creating blog:", {
        user_id: userId,
        blog_title,
        message,
        attachments: uploaded.length,
        tags,
      });

      const created = await prisma.blog.create({
        data: {
          user_id: userId,
          blog_title,
          message,
          blog_up: 0,
          blog_down: 0,
          ...(uploaded.length > 0 ? { attachments: uploaded } : {}),
          ...(tags.length > 0 ? { tags } : {}),
        },
      });

      return res.status(201).json({
        message: "inserted",
        insertedId: created.blog_id,
        data: created,
        uploaded_attachments: uploaded,
      });
    } catch (error) {
      console.error("POST /api/blog failed:", error);
      return res.status(500).json({
        error: "Database insert failed",
        detail: String(error.message || error),
      });
    }
  }
);

/* ----------------------- GET ALL BLOGS ----------------------- */

router.get("/", optionalAuth, async (_req, res) => {
  try {
    const result = await prisma.blog.findMany({
      orderBy: { blog_id: "desc" },
      select: {
        blog_id: true,
        blog_title: true,
        message: true,
        blog_up: true,
        blog_down: true,
        user_id: true,
        created_at: true,
        updated_at: true,
        attachments: true,
        tags: true,
        users: { select: { img: true, user_name: true } },
      },
    });

    const blogs = result.map((b) => mapBlog(b));

    res.json(blogs);
  } catch (error) {
    console.error("GET /api/blog failed:", error);
    res.status(500).json({ error: "fetch post fail" });
  }
});

/* ----------------------- GET SINGLE BLOG ----------------------- */

router.get("/:id", optionalAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: "Bad id" });

    const b = await prisma.blog.findUnique({
      where: { blog_id: id },
      select: {
        blog_id: true,
        blog_title: true,
        message: true,
        blog_up: true,
        blog_down: true,
        user_id: true,
        created_at: true,
        updated_at: true,
        attachments: true,
        tags: true,
        users: { select: { img: true, user_name: true } },
      },
    });
    if (!b) return res.status(404).json({ error: "Not found" });

    res.json(mapBlog(b));
  } catch (error) {
    console.error("GET /api/blog/:id failed:", error);
    res.status(500).json({ error: "fetch post fail" });
  }
});

/* ----------------------- UPDATE BLOG (title/message/tags/attachments) ----------------------- */

router.put(
  "/:id",
  requireMember,
  upload.array("attachments", 10),
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) {
        return res.status(400).json({ error: "Bad id" });
      }

      const { blog_title, message, tags: rawTags, attachments_json } =
        req.body || {};
      const userId = req.user?.id;

      const existing = await prisma.blog.findUnique({
        where: { blog_id: id },
        select: {
          blog_id: true,
          user_id: true,
          attachments: true,
        },
      });

      if (!existing) {
        return res.status(404).json({ error: "Not found" });
      }

      if (!userId || existing.user_id !== userId) {
        return res.status(403).json({ error: "Forbidden: not your blog" });
      }

      const data = {};

      if (typeof blog_title === "string" && blog_title.trim()) {
        data.blog_title = blog_title.trim();
      }
      if (typeof message === "string" && message.trim()) {
        data.message = message;
      }

      const tagsArr = normalizeTags(rawTags);
      if (tagsArr.length > 0) {
        data.tags = tagsArr;
      }

      // ------------ attachments ------------
      // Frontend always sends attachments_json (string), e.g. "[]"
      // so we treat it as "the exact list we want to keep",
      // and then append any new uploads.
      let kept = [];
      const hasAttachmentsJson =
        typeof attachments_json !== "undefined" && attachments_json !== null;

      if (hasAttachmentsJson) {
        try {
          const parsed = JSON.parse(attachments_json);
          if (Array.isArray(parsed)) {
            kept = parsed.map((a) => ({
              url: a.url,
              name: a.name,
              type: a.type,
              size: a.size,
            }));
          }
        } catch (e) {
          console.warn("Failed to parse attachments_json:", e);
        }
      }

      const newUploaded = filesToAttachments(req.files || []);

      if (hasAttachmentsJson) {
        // ⭐ even if kept & newUploaded are both empty → set attachments = []
        data.attachments = [...kept, ...newUploaded];
      } else if (newUploaded.length > 0) {
        // fallback: no attachments_json, just append to existing ones
        const existingAtts = Array.isArray(existing.attachments)
          ? existing.attachments
          : [];
        data.attachments = [...existingAtts, ...newUploaded];
      }
      // ------------ end attachments ------------

      if (Object.keys(data).length === 0) {
        return res.status(400).json({ error: "No fields to update" });
      }

      const updated = await prisma.blog.update({
        where: { blog_id: id },
        data,
        select: {
          blog_id: true,
          blog_title: true,
          message: true,
          blog_up: true,
          blog_down: true,
          user_id: true,
          created_at: true,
          updated_at: true,
          attachments: true,
          tags: true,
          users: { select: { img: true, user_name: true } },
        },
      });

      return res.json(mapBlog(updated));
    } catch (err) {
      console.error("PUT /api/blog/:id failed:", err);
      res.status(500).json({ error: "Failed to update blog" });
    }
  }
);

/* ----------------------- DELETE BLOG ----------------------- */

router.delete("/:id", requireMember, async (req, res) => {
  try {
    await prisma.blog.delete({
      where: { blog_id: Number(req.params.id) },
    });

    res.json("delete success");
  } catch (error) {
    console.error("DELETE /api/blog/:id failed:", error);
    res.status(500).json({ error: "can't deleted blog" });
  }
});

/* ----------------------- VOTE SIMPLE (LIKE/DISLIKE) ----------------------- */

router.post("/:id/vote-simple", optionalAuth, async (req, res) => {
  try {
    const blogId = Number(req.params.id);
    let { prev, next } = req.body || {};

    if (Number.isNaN(blogId)) {
      return res.status(400).json({ error: "Invalid blog id" });
    }

    const normalize = (v) => (v === "up" || v === "down" ? v : null);

    prev = normalize(prev);
    next = normalize(next);

    const blog = await prisma.blog.findUnique({
      where: { blog_id: blogId },
      select: { blog_up: true, blog_down: true },
    });

    if (!blog) {
      return res.status(404).json({ error: "Blog not found" });
    }

    let up = blog.blog_up ?? 0;
    let down = blog.blog_down ?? 0;

    if (prev !== next) {
      if (prev === null && next === "up") up += 1;
      else if (prev === null && next === "down") down += 1;
      else if (prev === "up" && next === null) up -= 1;
      else if (prev === "down" && next === null) down -= 1;
      else if (prev === "up" && next === "down") {
        up -= 1;
        down += 1;
      } else if (prev === "down" && next === "up") {
        down -= 1;
        up += 1;
      }
    }

    up = Math.max(0, up);
    down = Math.max(0, down);

    const updated = await prisma.blog.update({
      where: { blog_id: blogId },
      data: { blog_up: up, blog_down: down },
      select: { blog_up: true, blog_down: true },
    });

    return res.json({
      blog_up: updated.blog_up ?? 0,
      blog_down: updated.blog_down ?? 0,
      vote: next ?? null,
    });
  } catch (err) {
    console.error("POST /api/blog/:id/vote-simple failed:", err);
    return res.status(500).json({ error: "Failed to vote" });
  }
});

module.exports = router;

// backend/blog_api.js
const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { optionalAuth, requireMember,requireAuth } = require("./auth_mw");
const { prisma } = require("./lib/prisma.cjs");

// Ensure uploads folder exists
// In container this resolves to /app/backend/uploads (because cwd=/app/backend)
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Multer storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safe = Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
    cb(null, safe);
  },
});
const upload = multer({ storage });

// Helper: convert Multer files -> attachment objects for JSON column
function filesToAttachments(files = []) {
  return files.map((f) => ({
    url: `/uploads/${f.filename}`,   // will be served by index.js: app.use("/uploads", express.static(uploadDir))
    name: f.originalname,
    type: f.mimetype,
    size: f.size,
  }));
}

/**
 * POST /api/blog
 * Accepts:
 * - multipart/form-data (fields: user_id, blog_title, message; files: attachments[])
 * - OR application/json
 */
router.post("/",requireMember, upload.array("attachments", 10), async (req, res) => {
  try {
    const { user_id, blog_title, message } = req.body || {};
    if (!user_id || !blog_title || !message) {
      return res.status(400).json({ error: "Missing fields" });
    }

    // If request is multipart and has files, build attachment JSON
    const uploaded = filesToAttachments(req.files || []);

    const created = await prisma.blog.create({
      data: {
        user_id,
        blog_title,
        message,
        // store attachments JSON in DB if we have any
        attachments: uploaded.length ? uploaded : undefined,
      },
    });

    return res.status(201).json({
      message: "inserted",
      insertedId: created.blog_id,
      data: created,
      uploaded_attachments: uploaded, // optional: useful to debug
    });
  } catch (error) {
    console.error("POST /api/blog failed:", error);
    return res.status(500).json({ error: "Database insert failed" });
  }
});

/**
 * GET /api/blog
 * Now returns attachments as well.
 * Uses relation name "users" per your Prisma schema.
 */
router.get("/",optionalAuth, async (_req, res) => {
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
        attachments: true, // <- NEW
        users: { select: { img: true, user_name: true } },
      },
    });

    const blogs = result.map((b) => ({
      blog_id: b.blog_id,
      blog_title: b.blog_title,
      message: b.message,
      img: b.users?.img || null,
      user_name: b.users?.user_name || "anonymous",
      created_at: b.created_at,
      attachments: Array.isArray(b.attachments) ? b.attachments : [], // <- NEW
    }));

    res.json(blogs);
  } catch (error) {
    console.error("GET /api/blog failed:", error);
    res.status(500).json({ error: "fetch post fail" });
  }
});

/**
 * GET /api/blog/:id
 * Single post, with attachments.
 */
router.get("/:id",optionalAuth, async (req, res) => {
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
        attachments: true, // <- NEW
        users: { select: { img: true, user_name: true } },
      },
    });
    if (!b) return res.status(404).json({ error: "Not found" });

    res.json({
      blog_id: b.blog_id,
      blog_title: b.blog_title,
      message: b.message,
      img: b.users?.img || null,
      user_name: b.users?.user_name || "anonymous",
      created_at: b.created_at,
      attachments: Array.isArray(b.attachments) ? b.attachments : [], // <- NEW
    });
  } catch (error) {
    console.error("GET /api/blog/:id failed:", error);
    res.status(500).json({ error: "fetch post fail" });
  }
});

/**
 * PUT /api/blog
 * (Message update only, unchanged)
 */
router.put("/",requireMember, async (req, res) => {
  try {
    const { message, blog_id } = req.body || {};
    if (!blog_id) return res.status(400).json({ error: "Missing blog_id" });

    await prisma.blog.update({
      where: { blog_id: Number(blog_id) },
      data: { message },
    });

    res.json({ message: "updatesuccess" });
  } catch (err) {
    console.error("PUT /api/blog failed:", err);
    res.status(500).json({ error: "Failed to update blog" });
  }
});

/**
 * DELETE /api/blog/:id
 */
router.delete("/:id",requireMember, async (req, res) => {
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

module.exports = router;

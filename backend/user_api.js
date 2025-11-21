const express = require("express");
const router = express.Router();
const { prisma } = require('./lib/prisma.cjs');
const bcrypt = require("bcrypt");
const { optionalAuth } = require("./auth_mw");
const settingRouter = require('./user_setting_api');

const RESERVED = new Set([
  'api','admin','blog','note','notes','user','users','profile','profiles','settings',
  'login','logout','_next','favicon.ico','robots.txt','sitemap.xml','static','assets','public'
]);
const normHandle = (s='') => String(s).trim().toLowerCase();
const isValidHandle = (h) => /^[a-z0-9_.]{3,32}$/.test(h);


router.get('/by-handle/:handle', async (req, res) => {
  const handle = String(req.params.handle || '').toLowerCase();
  try {
    const user = await prisma.users.findFirst({
      where: { login_name: handle },
      select: {
        user_id: true,
        login_name: true,
        user_name: true,
        img: true,
      }
    });

    if (!user) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    return res.json({ ok: true, user });
  } catch (e) {
    console.error('[by-handle]', e);
    return res.status(500).json({ ok: false, error: e.code || e.message });
  }
});


router.get('/by-id/:id', async (req, res) => {
  try {
    const user = await prisma.users.findUnique({
      where: { user_id: String(req.params.id) },
      select: { user_id: true, login_name: true }
    });
    if (!user) return res.status(404).json({ ok:false });
    res.json({ ok:true, user });
  } catch (e) {
    console.error('[by-id]', e);
    res.status(500).json({ ok:false, error:'INTERNAL' });
  }
});

router.head('/exists/:handle', async (req, res) => {
  try {
    const handle = normHandle(req.params.handle);
    const found = await prisma.users.findUnique({
      where: { login_name: handle },
      select: { user_id: true }
    });
    res.status(found ? 200 : 404).end();
  } catch (e) {
    res.status(500).end();
  }
});

router.post('/validate-handle', async (req, res) => {
  try {
    let { handle, excludeUserId } = req.body || {};
    handle = normHandle(handle);
    if (!handle) return res.json({ ok:false, reason:'EMPTY' });
    if (!isValidHandle(handle)) return res.json({ ok:false, reason:'PATTERN' });
    if (RESERVED.has(handle)) return res.json({ ok:false, reason:'RESERVED' });

    const existing = await prisma.users.findUnique({ where: { login_name: handle } });
    if (existing && existing.user_id !== excludeUserId) {
      return res.json({ ok:false, reason:'TAKEN' });
    }
    res.json({ ok:true });
  } catch (e) {
    console.error('[validate-handle]', e);
    res.status(500).json({ ok:false, reason:'INTERNAL' });
  }
});

router.get('/', async (_req, res) => {
  try {
    const users = await prisma.users.findMany();
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'fetch user fail' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const user = await prisma.users.findUnique({
      where: { user_id: req.params.id },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.set('Cache-Control', 'no-store');
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'fetch user fail' });
  }
});



router.put('/:userId',optionalAuth, async (req, res) => {
  try {
    const paramId = String(req.params.userId || "").trim();
    const authedId = req.user?.id ? String(req.user.id) : null;
    const targetId = authedId || paramId;

    const { name, img } = req.body || {};
    if (!targetId) {
      return res.status(400).json({ error: "Missing userId" });
    }
    if (!name && !img) {
      return res.status(400).json({ error: "Nothing to update (name or img required)" });
    }

    const data = {};
    if (typeof name === "string" && name.trim()) data.user_name = name.trim();
    if (typeof img === "string" && img.trim()) data.img = img.trim();

    const existing = await prisma.users.findUnique({
      where: { user_id: targetId },
      select: { user_id: true, role: true, user_name: true },
    });

    if (!authedId && existing && existing.role !== "anonymous") {
      return res.status(403).json({ error: "Forbidden: cannot update a non-anonymous user without auth" });
    }

    const createdRole = authedId ? "member" : "anonymous";
    const createdName =
      data.user_name ||
      (authedId ? (req.user?.name || "anonymous") : "anonymous");

    const updated = await prisma.users.upsert({
      where: { user_id: targetId },
      update: data,
      create: {
        user_id: targetId,
        user_name: createdName,
        img: data.img || null,
        role: createdRole,
      },
      select: { user_id: true, user_name: true, img: true, role: true },
    });

    res.json({ ok: true, user: updated });
  } catch (err) {
    console.error("PUT /api/user/:userId error:", err);
    return res.status(500).json({ error: "Failed to update user" });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.users.delete({ where: { user_id: req.params.id } });
    res.json("delete success");
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: "User not found" });
    }
    console.error(error);
    res.status(500).json({ error: "can't delete user" });
  }
});

router.post('/merge', async (req, res) => {
  try {
    const { user_id, anonymous_id, user_name, email, image, role } = req.body;
    if (!user_id || !anonymous_id) {
      return res.status(400).json({ error: "Missing user_id or anonymous_id" });
    }

    await prisma.users.upsert({
      where: { user_id },
      update: { user_name, img: image, role },
      create: { user_id, user_name, email, img: image, role }
    });

    await prisma.users.deleteMany({
      where: { user_id: anonymous_id, NOT: { user_id } }
    });

    res.json({ message: "User merged successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Merge failed", detail: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { user_id, user_name } = req.body;
    if (!user_id) return res.status(400).json({ error: "Missing user_id" });

    const existing = await prisma.users.findUnique({ where: { user_id } });
    if (existing) {
      return res.json({ message: "User already exists", user: existing });
    }

    const gender = "Not_Specified";
    const img = "/images/pfp.png";

    const newUser = await prisma.users.create({
      data: { user_id, user_name: user_name || "anonymous", gender, img }
    });

    res.json({ message: "User registered successfully", user: newUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database insert failed" });
  }
});

router.use('/:id/setting', settingRouter);
module.exports = router;

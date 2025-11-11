const express = require("express");
const router = express.Router();
const { prisma } = require('./lib/prisma.cjs');
const bcrypt = require("bcrypt");
const settingRouter = require('./user_setting_api');

// ===== Reserved & helpers =====
const RESERVED = new Set([
  'api','admin','blog','note','notes','user','users','profile','profiles','settings',
  'login','logout','_next','favicon.ico','robots.txt','sitemap.xml','static','assets','public'
]);
const normHandle = (s='') => String(s).trim().toLowerCase();
const isValidHandle = (h) => /^[a-z0-9_.]{3,32}$/.test(h);

// ===== New: profile endpoints (PUT THESE ABOVE "/:id") =====

// GET /api/user/by-handle/:handle
// GET /api/user/by-handle/:handle
router.get('/by-handle/:handle', async (req, res) => {
  const handle = String(req.params.handle || '').toLowerCase();
  try {
    const user = await prisma.users.findFirst({
      where: { login_name: handle },
      // เลือกเฉพาะคอลัมน์ที่มีแน่ ๆ ใน DB คุณ (เพิ่มได้ภายหลัง)
      select: {
        user_id: true,
        login_name: true,
        user_name: true,
        img: true,
        // ถ้ายังไม่มีฟิลด์เหล่านี้ใน schema ให้คอมเมนต์ทิ้งไปก่อน:
        // bio: true,
        // location: true,
        // website: true,
        // created_at: true,
      }
    });

    if (!user) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    return res.json({ ok: true, user });
  } catch (e) {
    console.error('[by-handle]', e);
    // ส่งโค้ด error ออกไปให้ debug ง่าย
    return res.status(500).json({ ok: false, error: e.code || e.message });
  }
});


// GET /api/user/by-id/:id   (สำหรับ legacy redirect ฝั่ง frontend)
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

// HEAD /api/user/exists/:handle  (เช็คมี/ไม่มี แบบเบาๆ)
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

// POST /api/user/validate-handle  (ตรวจรูปแบบ/คำต้องห้าม/ซ้ำ)
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

// ===== Existing auth & user CRUD (kept, with small fixes) =====

router.post("/register", async (req, res) => {
  try {
    let { user_id, user_name, password, login_name } = req.body;

    if (!user_id || !password) {
      return res.status(400).json({ error: "Missing user_id or password" });
    }

    // normalize handle
    login_name = normHandle(login_name || '');

    if (login_name) {
      if (!isValidHandle(login_name)) {
        return res.status(400).json({ error: "Invalid login_name pattern" });
      }
      if (RESERVED.has(login_name)) {
        return res.status(400).json({ error: "This login_name is reserved" });
      }
    }

    const existing = await prisma.users.findUnique({ where: { user_id } });
    if (existing) {
      return res.status(409).json({ message: "User already exists", user: existing });
    }

    // ✅ change: findUnique instead of findMany
    if (login_name) {
      const existing_usrname = await prisma.users.findUnique({ where: { login_name } });
      if (existing_usrname) {
        return res.status(409).json({ message: "Username already exists", user: existing_usrname });
      }
    }

    const hash = await bcrypt.hash(password, 10);
    const newUser = await prisma.users.create({
      data: {
        user_id,
        user_name: user_name || "anonymous",
        password: hash,
        login_name: login_name || null,
        gender: "Not_Specified",
        img: "/images/pfp.png"
      }
    });

    res.json({ message: "User registered", user: newUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Registration failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    let { login_name, password } = req.body;
    if (!login_name || !password) return res.status(400).json({ error: "Missing credentials" });

    login_name = normHandle(login_name);
    const user = await prisma.users.findUnique({ where: { login_name } });
    if (!user) return res.status(404).json({ error: "Username not found" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: "Invalid password" });

    res.json({
      id: user.user_id,
      user_id: user.user_id,
      name: user.user_name,
      login_name: user.login_name,
      image: user.img
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed" });
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

// ⚠️ NOTE: keep this below the specific routes above
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

router.put('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { name } = req.body;

    if (!name || !userId) {
      return res.status(400).json({ error: "Missing name or userId" });
    }

    const updatedUser = await prisma.users.update({
      where: { user_id: userId },
      data: { user_name: name },
    });

    res.json({ message: "Name updated successfully", user_name: updatedUser.user_name });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: "User not found" });
    }
    console.error(err);
    res.status(500).json({ error: "Failed to update user name" });
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

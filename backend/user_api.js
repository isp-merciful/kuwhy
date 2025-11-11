const express = require("express");
const router = express.Router();
const { prisma } = require('./lib/prisma.cjs');
const bcrypt = require("bcrypt");
const { optionalAuth } = require("./auth_mw");
router.post("/register", async (req, res) => {
  try {
    const { user_id, user_name, password,login_name } = req.body;

    if (!user_id || !password) {
      return res.status(400).json({ error: "Missing user_id or password" });
    }

    const existing = await prisma.users.findUnique({ where: { user_id } });
    if (existing) {
      return res.status(409).json({ message: "User already exists", user: existing });
    }
    // const existing_mail = await prisma.users.findUnique({ where: { email } });
    // if (existing) {
    //   return res.status(409).json({ message: "Email already exists", user: existing_mail });
    // }
    const existing_usrname = await prisma.users.findMany({ where: { login_name } });
    if (existing_usrname.length > 0) {
      return res.status(409).json({ message: "Username already exists", user: existing_usrname });
    }







    const hash = await bcrypt.hash(password, 10);
    const newUser = await prisma.users.create({
      data: {
        user_id,
        // email,
        user_name: user_name || "anonymous",
        password: hash,
        login_name: login_name,
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
    const { login_name, password } = req.body;
    if (!login_name || !password) return res.status(400).json({ error: "Missing credentials" });

    const user = await prisma.users.findFirst({ where: { login_name } });
    if (!user) return res.status(404).json({ error: "Username not found" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: "Invalid password" });

    res.json({
      id: user.user_id,
      user_id: user.user_id,
      name: user.user_name,
      login_name : user.login_name,
      // email: user.email,
      image: user.img
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
});

router.get('/', async (req, res) => {
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

    // ป้องกัน cache
    res.set('Cache-Control', 'no-store');
    res.json(user); // <= ไม่ใช่ array แล้ว
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

    // เตรียม patch
    const data = {};
    if (typeof name === "string" && name.trim()) data.user_name = name.trim();
    if (typeof img === "string" && img.trim()) data.img = img.trim();

    // ป้องกัน anonymous ไปแก้ user คนอื่นที่ไม่ใช่ anonymous
    const existing = await prisma.users.findUnique({
      where: { user_id: targetId },
      select: { user_id: true, role: true, user_name: true },
    });

    // ถ้าล็อกอิน → อนุญาตเสมอ (แต่ targetId จะถูก fix เป็นเจ้าของ token)
    // ถ้าไม่ล็อกอิน:
    //  - ถ้ายังไม่มีผู้ใช้ → อนุญาตสร้างเป็น anonymous
    //  - ถ้ามีอยู่และ role != 'anonymous' → ห้ามแก้
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
    await prisma.users.delete({
      where: {
        user_id: req.params.id,
      },
    });

    res.json("delete success");
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: "User not found" });
    }

    console.error(error);
    res.status(500).json({
      error: "can't delete user"
    });
  }
});

router.post('/merge', async (req, res) => {
  try {
    const { user_id, anonymous_id, user_name, email, image, role } = req.body;

    if (!user_id || !anonymous_id) {
      return res.status(400).json({ error: "Missing user_id or anonymous_id" });
    }

    // 🧩 อัปเดตหรือสร้าง user ตัวจริง
    await prisma.users.upsert({
      where: { user_id },
      update: {
        user_name,
        img: image,
        role
      },
      create: {
        user_id,
        user_name,
        email,
        img: image,
        role
      }
    });

    // 🧹 ลบ anonymous user ถ้ามี
    await prisma.users.deleteMany({
      where: {
        user_id: anonymous_id,
        NOT: { user_id } // ป้องกันไม่ให้ลบตัวจริง
      }
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

    if (!user_id) {
      return res.status(400).json({ error: "Missing user_id" });
    }

    // ตรวจสอบว่าผู้ใช้มีอยู่แล้วหรือไม่
    const existing = await prisma.users.findUnique({
      where: { user_id: user_id }
    });

    if (existing) {
      return res.json({
        message: "User already exists",
        user: existing
      });
    }

    const gender = "Not_Specified";
    const img = "/images/pfp.png";

    // สร้างผู้ใช้ใหม่
    const newUser = await prisma.users.create({
      data: {
        user_id,
        user_name: user_name || "anonymous",
        gender,
        img
      }
    });

    res.json({
      message: "User registered successfully",
      user: newUser
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database insert failed" });
  }
});


module.exports = router;
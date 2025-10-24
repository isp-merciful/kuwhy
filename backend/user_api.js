const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");

router.post("/register", async (req, res) => {
  try {
    const { user_id, user_name, email, password } = req.body;

    if (!user_id || !password) {
      return res.status(400).json({ error: "Missing user_id or password" });
    }

    const existing = await prisma.users.findUnique({ where: { user_id } });
    if (existing) {
      return res.status(409).json({ message: "User already exists", user: existing });
    }
    const existing_mail = await prisma.users.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: "Email already exists", user: existing_mail });
    }
    const existing_usrname = await prisma.users.findMany({ where: { user_name } });
    if (existing_usrname.length > 0) {
      return res.status(409).json({ message: "Username already exists", user: existing_usrname });
    }




    const hash = await bcrypt.hash(password, 10);
    const newUser = await prisma.users.create({
      data: {
        user_id,
        email,
        user_name: user_name || "anonymous",
        password: hash,
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
    const { user_id, password } = req.body;
    if (!user_id || !password) return res.status(400).json({ error: "Missing credentials" });

    const user = await prisma.users.findUnique({ where: { user_id } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: "Invalid password" });

    res.json({
      id: user.user_id,
      user_id: user.user_id,
      name: user.user_name,
      email: user.email,
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
    const users = await prisma.users.findMany({where: {user_id:req.params.id}});
    res.json(users);
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
    if (err.code === 'P2025') { // Prisma error: record not found
      return res.status(404).json({ error: "User not found" });
    }

    console.error(err);
    res.status(500).json({ error: "Failed to update user name" });
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
const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");

router.post("/register", async (req, res) => {
  try {
    const { user_id, user_name, email, d_name, password } = req.body;

    if (!user_id || !password) {
      return res.status(400).json({ error: "Missing user_id or password" });
    }

    const existing = await prisma.users.findUnique({ where: { user_id } });
    if (existing) {
      return res.status(409).json({ message: "User already exists", user: existing });
    }
    const existing_mail = await prisma.users.findMany({ where: { email } });
    if (existing_mail.length > 0) {
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
        dp_name: d_name || "anonymous",
        password: hash,
        gender: "NotSpecified",
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

router.post("/oauth/upsert", async (req, res) => {
  try {
    const { provider, providerId, email, name, image } = req.body;
    if (!provider || !providerId) return res.status(400).json({ error: "Missing provider data" });

   
    let user;
    if (email) {
      user = await prisma.users.findUnique({ where: { email } });
    }

    if (!user) {
      const user_id = uuidv4();
      user = await prisma.users.create({
        data: {
          user_id,
          email: email || null,
          user_name: name || "oauth-user",
          dp_name: name || "oauth-user",
          password: "", 
          gender: "NotSpecified",
          img: image || "/images/pfp.png"
        }
      });
    } else {
 
      user = await prisma.users.update({
        where: { user_id: user.user_id },
        data: {
          user_name: name || user.user_name,
          img: image || user.img
        }
      });
    }

   
    res.json({
      id: user.user_id,
      user_id: user.user_id,
      name: user.user_name,
      email: user.email,
      image: user.img
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "OAuth upsert failed" });
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




module.exports = router;
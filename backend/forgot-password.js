const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const router = express.Router();

/* ==========  Nodemailer Transport ========== */

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false, // ถ้าใช้ port 465 ให้เปลี่ยนเป็น true
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/* ==========  1) POST /auth/forgot-password  ========== */
/*
  body: { email: string }
*/
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "email is required" });
  }

  try {
    // TODO: ปรับชื่อ model/field ให้ตรง schema จริง เช่น prisma.users / prisma.user
    const user = await prisma.users.findFirst({
      where: { email: email },
      select: { user_id: true, email: true },
    });

    // เพื่อความปลอดภัย: ไม่บอกว่า email ไม่มี (กัน brute force)
    if (!user) {
      return res.json({
        message: "If this email is registered, we have sent a reset link.",
      });
    }

    const payload = {
      userId: user.user_id,
      type: "reset",
    };

    // token อายุ 24 ชม.
    const token = jwt.sign(payload, process.env.JWT_RESET_SECRET, {
      expiresIn: "24h",
    });

    const resetLink = `${process.env.BACKEND_BASE_URL}/auth/reset-password?token=${encodeURIComponent(
      token
    )}`;

    await transporter.sendMail({
      from: `"KUWHY Support" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: "Reset your password",
      html: `
        <p>Hello,</p>
        <p>We received a request to reset your password.</p>
        <p>
          Click this link to reset your password (valid for 24 hours):<br/>
          <a href="${resetLink}">${resetLink}</a>
        </p>
        <p>If you did not request this, you can ignore this email.</p>
      `,
    });

    return res.json({ message: "Reset link sent (if email exists)." });
  } catch (err) {
    console.error("forgot-password error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/* ==========  2) GET /auth/reset-password (จากลิงก์ในเมล)  ========== */

router.get("/reset-password", (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.redirect(
      `${process.env.FRONTEND_BASE_URL}/reset-password?error=missing_token`
    );
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_RESET_SECRET);

    if (payload.type !== "reset") {
      throw new Error("wrong token type");
    }

    // token ใช้ได้ → redirect ไปหน้า frontend พร้อม token
    const redirectUrl = `${process.env.FRONTEND_BASE_URL}/reset-password?token=${encodeURIComponent(
      token
    )}`;

    return res.redirect(302, redirectUrl);
  } catch (err) {
    console.error("verify reset token error:", err);
    return res.redirect(
      `${process.env.FRONTEND_BASE_URL}/reset-password?error=invalid_or_expired`
    );
  }
});

/* ==========  3) POST /auth/reset-password (เปลี่ยนรหัสจริง)  ========== */
/*
  body: { token: string, password: string }
*/

router.post("/reset-password", async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ error: "token and password are required" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_RESET_SECRET);

    if (payload.type !== "reset") {
      throw new Error("wrong token type");
    }

    const hashed = await bcrypt.hash(password, 10);

    // TODO: ปรับ model/field ให้ตรงของจริง
    await prisma.users.update({
      where: { user_id: payload.userId },
      data: { password: hashed },
    });

    return res.json({ message: "Password has been reset." });
  } catch (err) {
    console.error("reset-password error:", err);
    return res.status(400).json({ error: "Invalid or expired token" });
  }
});

module.exports = router;

// backend/forgot-password.js
const express = require("express");
const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
require("dotenv").config();
const prisma = new PrismaClient();
const router = express.Router();

/* ---------- Nodemailer Transport ---------- */

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false, // ถ้าใช้ port 465 ค่อยเปลี่ยนเป็น true
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});


// ลอง verify ตอนโหลดไฟล์ (จะเห็น error ชัด ๆ เลยถ้า config ผิด)
transporter
  .verify()
  .then(() => {
    console.log("[mail] SMTP server is ready to take messages");
  })
  .catch((err) => {
    console.error("[mail] SMTP verify failed:", err);
  });

/* ---------- 1) POST /auth/forgot-password ---------- */
/* body: { email: string } */

router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  console.log("[forgot-password] incoming request for email:", email);

  if (!email) {
    return res.status(400).json({ error: "email is required" });
  }

  try {
    // ❗ ดูให้ชัวร์ว่า model / field ตรงกับ schema ของโปรเจกต์
    // ถ้า users ไม่มีฟิลด์ email จริง ๆ อันนี้จะหา user ไม่เจอ => ไม่ส่งเมลแน่นอน
    const user = await prisma.users.findFirst({
      where: { email: email },
      select: { user_id: true, email: true },
    });

    if (!user) {
      console.log(
        "[forgot-password] NO user found for email:",
        email,
        "=> no email will be sent (but respond 200 generic)"
      );

      // เพื่อความปลอดภัย: ไม่บอกว่าไม่มี user
      return res.json({
        message: "If this email is registered, we have sent a reset link.",
      });
    }

    console.log(
      "[forgot-password] user found:",
      user.user_id,
      "email:",
      user.email
    );

    const payload = {
      userId: user.user_id,
      type: "reset",
    };
    
    if (!process.env.JWT_RESET_SECRET) {
        console.error("[forgot-password] JWT_RESET_SECRET is missing in env");
        return res.status(500).json({ error: "Server misconfigured" });
        }

    const token = jwt.sign(payload, process.env.JWT_RESET_SECRET, {
      expiresIn: "24h",
    });
    

    const resetLink = `${process.env.BACKEND_BASE_URL}/auth/reset-password?token=${encodeURIComponent(
      token
    )}`;

    console.log("[forgot-password] sending reset link to:", user.email);
    console.log("[forgot-password] link:", resetLink);
const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Reset your KU WHY password</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table cellpadding="0" cellspacing="0" width="100%" style="max-width:480px;background:#ffffff;border-radius:16px;box-shadow:0 10px 25px rgba(15,23,42,0.12);overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="padding:24px;text-align:center;background:linear-gradient(135deg,#22c55e,#0ea5e9);color:#f9fafb;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
              <div style="font-size:24px;font-weight:700;">KU WHY</div>
              <div style="margin-top:4px;font-size:13px;opacity:.9;">Password reset request</div>
            </td>
          </tr>

          <!-- Message -->
          <tr>
            <td style="padding:24px 24px 8px 24px;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#111827;font-size:14px;line-height:1.6;">
              <p style="margin:0 0 12px 0;">Hello,</p>
              <p style="margin:0 0 12px 0;">
                We received a request to reset your KU WHY password.
                Click the button below to choose a new password.
              </p>
            </td>
          </tr>

          <!-- Button -->
          <tr>
            <td align="center" style="padding:8px 24px 24px 24px;">
              <a href="${resetLink}"
                 style="display:inline-block;padding:12px 28px;border-radius:999px;
                        background:linear-gradient(135deg,#2563eb,#22c55e);
                        color:#ffffff !important;text-decoration:none;
                        font-size:14px;font-weight:600;
                        font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
                Reset your password
              </a>
            </td>
          </tr>

          <!-- Extra info -->
          <tr>
            <td style="padding:0 24px 20px 24px;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#6b7280;font-size:12px;line-height:1.5;">
              <p style="margin:0 0 8px 0;">
                This link will be valid for 24 hours and can only be used once.
              </p>
              <p style="margin:0;">
                If you didn’t request this, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:12px 24px 24px 24px;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#9ca3af;font-size:11px;text-align:center;border-top:1px solid #e5e7eb;">
              KU WHY · Kasetsart University
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;



    let info;
    try {
      info = await transporter.sendMail({
        from: `"KUWHY Support" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: "Reset your password",
        html: emailHtml,
      });
    } catch (mailErr) {
      console.error("[forgot-password] sendMail error:", mailErr);
      return res
        .status(500)
        .json({ error: "Failed to send email. Please try again later." });
    }

    console.log(
      "[forgot-password] mail sent. messageId:",
      info && info.messageId
    );

    return res.json({ message: "Reset link sent (if email exists)." });
  } catch (err) {
    console.error("forgot-password error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/* ---------- 2) GET /auth/reset-password ---------- */

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

/* ---------- 3) POST /auth/reset-password ---------- */

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

    // ❗ ตรงนี้เหมือนกัน ปรับชื่อ model / field ให้ตรง schema
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

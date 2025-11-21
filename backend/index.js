const express = require('express');
require('dotenv').config();
const cors = require("cors");
const cookieParser = require('cookie-parser');
const path = require("path");
const fs = require("fs");

const blogRouter = require("./blog_api");
const commentRouter = require("./comment_api");
const noteRouter = require("./note_api");
const userRouter = require("./user_api");
const notificationRouter = require("./notification_api");
const partyChatApi = require("./party_chat_api");
const Forgotpassword = require("./forgot-password");
const reportApi = require("./report_api");
const punishmentApi = require("./punishment_api");
const { requireMember, requireAdmin } = require("./auth_mw");
const settings = require("./user_setting_api");

const { jwtDecrypt, jwtVerify } = require('jose');
const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'unset-secret');
const s = (process.env.NEXTAUTH_SECRET || '').trim();
console.log('[BOOT] SECRET head/tail:', s.slice(0, 4), '...', s.slice(-4), 'len=', s.length);

const app = express();

app.use(
  cors({
    origin:
      (process.env.CORS_ORIGIN && process.env.CORS_ORIGIN.split(",")) ||
      ["http://localhost:3000"],
    methods: ["GET", "POST", "PUT","PATCH", "DELETE","OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(cookieParser());

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));


const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
app.use("/uploads", express.static(uploadDir));



app.use("/auth",Forgotpassword );
app.use("/api/blog", blogRouter);
app.use("/api/noti", notificationRouter);
app.use("/api/comment", commentRouter);
app.use("/api/note", noteRouter);
app.use("/api/user", userRouter);
app.use("/api/chat", requireMember, partyChatApi);
app.use("/api/settings",requireMember,settings)
app.use("/api/report", reportApi);
app.use("/api/punish", punishmentApi);


/* ================== START SERVER ================== */

const PORT = process.env.PORT || 8000;
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

module.exports = app;
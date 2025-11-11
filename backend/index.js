// server.js
const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();
const cors = require("cors");
const cookieParser = require('cookie-parser');

const blogRouter = require("./blog_api");
const commentRouter = require("./comment_api");
const noteRouter = require("./note_api");
const userRouter = require("./user_api");
const notificationRouter = require("./notification_api");
const partyChatApi = require("./party_chat_api");

const { requireMember, requireAdmin } = require("./auth_mw");
const settings = require("./user_setting_api");   // PUT /api/setting  (session only) 

const app = express();

// app.options('/:splat*', cors());

app.use(cors({
  origin: "http://localhost:3000",
  methods: ["GET","POST","PUT","DELETE","OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// === ใช้ session-only สำหรับโปรไฟล์/ตั้งค่า ===
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// === ส่วนอื่นตามสิทธิ์เดิม ===
app.use("/api/blog", requireMember, blogRouter);
app.use("/api/noti", notificationRouter);
app.use("/api/comment", commentRouter);
app.use("/api/note", noteRouter);
app.use("/api/user", userRouter);
app.use("/api/chat", requireMember, partyChatApi);
app.use("/api/settings",settings)

const port = process.env.PORT || 8000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

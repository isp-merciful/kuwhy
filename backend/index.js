// backend/index.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const path = require("path");
const fs = require("fs");

// Routers
const blogRouter = require("./blog_api");
const commentRouter = require("./comment_api");
const noteRouter = require("./note_api");
const userRouter = require("./user_api");
const notificationRouter = require("./notification_api");
const partyChatApi = require("./party_chat_api");

// 1) create app FIRST
const app = express();

// 2) core middlewares
app.use(express.json()); // replaces bodyParser.json()
app.use(
  cors({
    origin:
      (process.env.CORS_ORIGIN && process.env.CORS_ORIGIN.split(",")) ||
      ["http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// 3) static uploads (ensure folder exists)
const uploadDir = path.join(process.cwd(), "uploads"); // in container: /app/backend/uploads if cwd=/app/backend
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
app.use("/uploads", express.static(uploadDir));

// 4) routes
app.use("/api/blog", blogRouter);
app.use("/api/noti", notificationRouter);
app.use("/api/comment", commentRouter);
app.use("/api/note", noteRouter);
app.use("/api/user", userRouter);
app.use("/api/chat", partyChatApi);

// 5) start server (bind 0.0.0.0 for Docker)
const port = process.env.PORT || 8000;
app.listen(port, "0.0.0.0", () => {
  console.log(`Server is running on port ${port}`);
});

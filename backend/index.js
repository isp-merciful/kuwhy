const express = require('express'); 
const bodyParser = require('body-parser');
require('dotenv').config();
const cors = require("cors");
const blogRouter = require("./blog_api");
const commentRouter = require("./comment_api");
const noteRouter = require("./note_api");
const userRouter = require("./user_api");
const notificationRouter = require("./notification_api");
const partyChatApi = require("./party_chat_api");

const app = express();
app.use(bodyParser.json());

app.use(cors({
  origin: "http://localhost:3000", 
  methods: ["GET", "POST","PUT","DELETE"],        
  credentials: true
}));


app.use("/api/blog", blogRouter);
app.use("/api/noti", notificationRouter);
app.use("/api/comment", commentRouter);
app.use("/api/note", noteRouter);
app.use("/api/user", userRouter);
app.use("/api/chat", partyChatApi);

const port = process.env.PORT || 8000;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});


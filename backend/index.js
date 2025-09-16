const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');
require('dotenv').config();

const cors = require("cors");
const { router: blogRouter, DBconnect: setblogDB } = require("./blog_api");
const { router: commentRouter, DBconnect: setcommentDB } = require("./comment_api");
const { router: noteRouter, DBconnect: setnoteDB } = require("./note_api");
const { router: userRouter, DBconnect: setuserDB } = require("./user_api");


const app = express();
app.use(bodyParser.json());


app.use(cors({
  origin: "http://localhost:3000", 
  methods: ["GET", "POST","PUT","DELETE"],        
  credentials: true
}));



let wire = null;

async function init() {
  const wire = await mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});
  console.log("MySQL connected");
  setblogDB(wire);
  setcommentDB(wire);
  setnoteDB(wire);
  setuserDB(wire);
  app.use("/api/blog", blogRouter);
  app.use("/api/comment", commentRouter);
  app.use("/api/note", noteRouter);
  app.use("/api/user", userRouter);


  app.listen(8000, () => {
    console.log("Server running on port 8000");
  });
}
init();
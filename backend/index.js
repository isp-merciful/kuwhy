const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');
require('dotenv').config();

const cors = require("cors");
const { router: noteRouter, DBconnect: setBlogDB } = require("./note_api");


const app = express();
app.use(bodyParser.json());


app.use(cors({
  origin: "http://localhost:3000", 
  methods: ["GET", "POST"],        
  credentials: true
}));



let wire = null;

async function init() {
  const wire = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "ispgayweead",
    database: "ispgraveyard",
    port: 3306,
  });
  console.log("MySQL connected");
  setBlogDB(wire);

  app.use("/api/note", noteRouter);

  app.listen(8000, () => {
    console.log("Server running on port 8000");
  });
}
init();
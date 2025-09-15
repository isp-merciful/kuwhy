const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');

const cors = require("cors");
const { router: blogRouter, DBConnect: setBlogDB } = require("./blog_api");


const app = express();
app.use(bodyParser.json());


app.use(cors({
  origin: "http://localhost:3000", 
  methods: ["GET", "POST"],        
  credentials: true
}));



let wire = null;

const waitconnection = async () => {
    wire = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'ispgraveyard!',
        database: 'ispgraveyard',
        port: 3306
    });
    console.log("MySQL connected");
};

setBlogDB(wire);
app.use("/api/blog", blogRouter);

app.listen(8000, async () => {
    await waitconnection();
    console.log("Server running on port 8000");

});


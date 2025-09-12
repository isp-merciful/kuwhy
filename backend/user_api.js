const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');

const cors = require("cors");



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
        password: 'ispgayweead',
        database: 'ispgraveyard',
        port: 3306
    });
    console.log("MySQL connected");
};

app.post('/api/create_users', async (req, res) => {
    try{
        const {user_id,user_name,gender} = req.body;
        
        const result = await wire.query(
            'INSERT INTO users (user_id,user_name,gender) VALUES (?,?,?)',
            [user_id, user_name, gender]
        );
        res.json({
            message: 'inserted',
            insertedId: result.insertId
        });

    } catch(error) {
        console.error(error);
        res.status(500).json({error : 'Database insert failed'});
    }
});

app.get('/api/get_alluser', async(req,res) =>{
    try{
        let result = await wire.query('SELECT * from users'
        )
        res.json(result[0])
    }catch(error) {
        console.error(error);
        res.status(500).json({error : 'fetch user fail'});
    }
});

app.listen(8000, async () => {
    await waitconnection();
    console.log("Server running on port 8000");

});

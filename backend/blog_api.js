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

app.post('/api/blog_api', async (req, res) => {
    try{
        const {user_id,blog_title,message} = req.body;
        
        const result = await wire.query(
            'INSERT INTO blog (user_id,blog_title,message) VALUES (?,?,?)',
            [user_id, blog_title, message]
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

app.get('/api/blog_api', async(req,res)=> {
    try{
        let result = await wire.query(`select b.blog_id,b.title,
            b.message,u.img,u.user_name,b.created_at
            from note n left join blog b ON b.author = u.user_id
            ORDER BY n.note_id DESC;

            `
        )
        res.json(result[0])
    }catch(error) {
        console.error(error);
        res.status(500).json({error : 'fetch post fail'});
    }
});

app.listen(8000, async () => {
    await waitconnection();
    console.log("Server running on port 8000");

});

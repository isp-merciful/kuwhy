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
        password: 'ispgraveyard!',
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
app.get('/api/note_api', async(req,res)=> {
    try{
        let result = await wire.query(`select n.note_id,n.message,
            u.img,u.user_name,n.created_at
            from note n left join users u ON n.author = u.user_id
            ORDER BY n.note_id DESC;
            `
        )
        res.json(result[0])
    }catch(error) {
        console.error(error);
        res.status(500).json({error : 'fetch post fail'});
    }
});

app.post('/api/note_api', async (req, res) => {
  try {
    const { user_name, message } = req.body;

    if (!message) {
      throw new Error('ไม่มี notes');
    }
    
    const [userResult] = await wire.query(
      'INSERT INTO users (user_name, gender, img) VALUES (?, ?, ?)',
      [user_name, 'ไม่ระบุ', '/images/pfp.png']
    );

    const authorId = userResult.insertId; 

    const [noteResult] = await wire.query(
      'INSERT INTO note (message, author) VALUES (?, ?)',
      [message, authorId]
    );

    console.log('Note added with id:', noteResult.insertId, 'author:', authorId);

    res.status(201).json({
      success: true,
      note_id: noteResult.insertId,
      author: authorId,
      user_name: user_name,
      message
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'add notes fail' });
  }
});


app.delete('/api/note_api', async(req,res) => {
    try{

    }catch(error){
        console.error(error);
        res.status(500).json({
            error:"can't deleted "
        })
    }
})

app.listen(8000, async () => {
    await waitconnection();
    console.log("Server running on port 8000");
});
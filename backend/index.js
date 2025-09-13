const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');

const cors = require("cors");
const { v4: uuidv4 } = require('uuid');

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
    const { user_name, message, user_id } = req.body; 
    console.log(req.body)
    if (!message) {
      throw new Error('ไม่มี notes');
    }
    if (!user_id) {
      return res.status(400).json({ error: 'Missing user_id' });
    }

    const [existingUser] = await wire.query(
      'SELECT * FROM users WHERE user_id = ?',
      [user_id]
    );

    if (existingUser.length === 0) {
      await wire.query(
        'INSERT INTO users (user_id, user_name, gender, img) VALUES (?, ?, ?, ?)',
        [user_id, user_name || 'anonymous', 'ไม่ระบุ', '/images/pfp.png']
      );
    }

    const [noteResult] = await wire.query(
      'INSERT INTO note (message, author) VALUES (?, ?)',
      [message, user_id]
    );

    console.log('Note added with id:', noteResult.insertId, 'author:', user_id);

    res.status(201).json({
      success: true,
      note_id: noteResult.insertId,
      author: user_id,
      user_name: user_name,
      message
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'add notes fail'});
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


// GET comments สำหรับ noteId
app.get("/api/comment/:noteId", async (req, res) => {
  const noteId = req.params.noteId;
  try {
    const [rows] = await wire.query(
      "SELECT c.comment_id, c.content, c.created_at, u.user_name " +
      "FROM comment c " +
      "LEFT JOIN users u ON c.author = u.user_id " +
      "WHERE c.note_id = ? " +
      "ORDER BY c.comment_id ASC",
      [noteId]
    );
    res.json(rows); // ✅ ส่งเป็น array
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "fetch comment fail" });
  }
});


// เพิ่ม comment
app.post('/api/comment', async (req, res) => {
  try {
    const { note_id, author, content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'comment is required' });
    }
    const [commentResult] = await wire.query(
      'INSERT INTO comment (note_id, author, content) VALUES (?, ?, ?)',
      [note_id, author, content]
    );

    res.status(201).json({
      success: true,
      comment_id: commentResult.insertId,
      note_id,
      author,
      content
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'add comment fail' });
  }
});


app.delete('/api/comment/:comment_id', async (req, res) => {
  try {
    const { comment_id } = req.params;
    const [result] = await wire.query(
      'DELETE FROM comment WHERE comment_id = ?',
      [comment_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'comment not found' });
    }

    res.json({ success: true, message: 'comment deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'delete comment fail' });
  }
});











app.listen(8000, async () => {
    await waitconnection();
    console.log("Server running on port 8000");

});


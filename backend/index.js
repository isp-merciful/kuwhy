const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');

const cors = require("cors");
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(bodyParser.json());


app.use(cors({
  origin: "http://localhost:3000", 
  methods: ["GET", "POST","PUT","DELETE"],        
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

app.put('/api/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { name } = req.body;

    if (!name || !userId) {
      return res.status(400).json({ error: "Missing name or userId" });
    }

    const [result] = await wire.query(
      "UPDATE users SET user_name = ? WHERE user_id = ?",
      [name, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "Name updated successfully", user_name: name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update user name" });
  }
});



app.post('/api/create_users', async (req, res) => {
  try {
    const { user_id, user_name } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: "Missing user_id" });
    }

    const [existing] = await wire.query(
      "SELECT * FROM users WHERE user_id = ?",
      [user_id]
    );

    if (existing.length > 0) {
      return res.json({
        message: "User already exists",
        user: existing[0]
      });
    }

    const gender = "ไม่ระบุ";
    const img = "/images/pfp.png";

    await wire.query(
      "INSERT INTO users (user_id, user_name, gender, img) VALUES (?, ?, ?, ?)",
      [user_id, user_name || "anonymous", gender, img]
    );

    res.json({
      message: "User registered successfully",
      user_id,
      user_name: user_name || "anonymous",
      gender,
      img
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database insert failed" });
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
            from note n left join users u ON n.user_id = u.user_id
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
      'INSERT INTO note (message, user_id) VALUES (?, ?)',
      [message, user_id]
    );

    console.log('Note added with id:', noteResult.insertId, 'user_id:', user_id);

    res.status(201).json({
      success: true,
      note_id: noteResult.insertId,
      user_id: user_id,
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


function CommentTree(comments) {
  const map = {};
  const roots = [];

  // map comment_id → comment พร้อม children
  comments.forEach(c => {
    map[c.comment_id] = { ...c, children: [] };
  });

  // loop comments แล้วใส่เข้า parent
  comments.forEach(c => {
    if (c.parent_coment_id) {
      if (map[c.parent_coment_id]) {
        map[c.parent_coment_id].children.push(map[c.comment_id]);
      }
    } else {
      roots.push(map[c.comment_id]);
    }
  });

  // เรียง root ตาม created_at
  roots.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  // recursive sort children
  function sortChildren(node) {
    if (!node.children || node.children.length === 0) return;
    node.children.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    node.children.forEach(sortChildren);
  }

  roots.forEach(sortChildren);
  return roots;
}



// API: ดึง comment ทั้งหมดเป็น tree
app.get('/api/comment_api/:note_id', async (req, res) => {
  try {
    const [result] = await wire.query(
      `SELECT c.*, u.user_name, u.img
       FROM comment c
       JOIN users u ON c.user_id = u.user_id
       WHERE c.note_id = ?
       ORDER BY c.created_at ASC`,
      [req.params.note_id]
    );

    const commentTree = CommentTree(result);

    res.json({
      message: "getnote",
      comment: commentTree
    });

  } catch (error) {
    console.error("❌ Fetch error:", error);
    res.status(500).json({
      error: error.message,
      message: "can't fetch note comment"
    });
  }
});

app.post('/api/comment_api', async (req, res) => {
  try {
    const { user_id,message,blog_id,note_id,parent_coment_id } = req.body;

    if (!user_id || !message) {
      throw new Error('ไม่มี notes หรือ username');
    }
    

    const [result] = await wire.query(
      'INSERT INTO comment (user_id, message, blog_id,note_id,parent_comment_id) VALUES (?, ?, ?, ?, ?)',
      [user_id, message, blog_id || null,note_id || null ,parent_coment_id || null]
    );

    res.json({
        message : "add comment sucessful",
        comment : result
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message
        ,massage :'add notes fail' });
  }
});



// app.get('/api/comment_api/:post_id', async(req,res) =>{
//     try{
//         const[result] = await wire.query(
//             `select c* ,u.user_name , u.img
//             from comment c join users on c.user_id = u.user_id
//             where c.post_id = ? order by c.created_at ASC`,
//             [req.params.post_id]
//         )
//     const commenttree = CommentTree(result);
//     res.json(commenttree);
//     }
//     catch(error){
//         res.status(500).json({error:error.message,massage : "can't fetch post comment "})
//     }

// });



// app.get('/api/comment_api/:comment_id', async(req,res) =>{
//     try{
//         const[result] = await wire.query(
//             `select c* ,u.user_name , u.img
//             from comment c join users on c.user_id = u.user_id
//             where c.parent_comment_id = ? order by c.created_at ASC`,
//             [req.params.comment_id]
//         )
//         res.json({message : "getchildcomment",
//             comment:result
//         }

//         );
//     }
//     catch(error){
//         res.status(500).json({error:error.message
//             ,message : "can't fetch child comment "
//         })
//     }

// });



app.listen(8000, async () => {
    await waitconnection();
    console.log("Server running on port 8000");

});
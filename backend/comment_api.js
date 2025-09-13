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


function CommentTree(comments) {
  const map = {};
  const roots = [];

  comments.forEach(c => {
    map[c.comment_id] = { ...c, children: [] };
  });

  comments.forEach(c => {
    if (c.parent_comment_id) {
      map[c.parent_comment_id].children.push(map[c.comment_id]);
    } else {
      roots.push(map[c.comment_id]);
    }
  });

  return roots;
}

app.post('/api/comment_api', async (req, res) => {
  try {
    const { author, message,post_id,note_id,parent_coment_id } = req.body;

    if (!user_name || !message) {
      throw new Error('ไม่มี notes หรือ username');
    }
    

    const [result] = await wire.query(
      'INSERT INTO comment (author, message, post_id,note_id,parent_coment_id) VALUES (?, ?, ?, ?, ?)',
      [author, message, post_id || null,note_id || null ,parent_coment_id || null]
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


app.get('/api/comment_api/:post_id', async(req,res) =>{
    try{
        const[result] = await wire.query(
            `select c* ,u.user_name , u.img
            from comment c join users on c.author = u.user_id
            where c.post_id = ? order by c.created_at ASC`,
            [req.params.post_id]
        )
    const commenttree = CommentTree(result);
    res.json(commenttree);
    }
    catch(error){
        res.status(500).json({error:error.message,massage : "can't fetch post comment "})
    }

});

app.get('/api/comment_api/:note_id', async(req,res) =>{
    try{
        const[result] = await wire.query(
            `select c* ,u.user_name , u.img
            from comment c join users on c.author = u.user_id
            where c.note_id = ? order by c.created_at ASC`,
            [req.params.post_id]
        )
        const commenttree = buildCommentTree(result);
        res.json({message : "getnote",
            comment:commenttree
        }

        );
    }
    catch(error){
        res.status(500).json({error:error.massage,
            message : "can't fetch note comment "
        })
    }

});

app.get('/api/comment_api/:comment_id', async(req,res) =>{
    try{
        const[result] = await wire.query(
            `select c* ,u.user_name , u.img
            from comment c join users on c.author = u.user_id
            where c.parent_comment_id = ? order by c.created_at ASC`,
            [req.params.comment_id]
        )
        res.json({message : "getchildcomment",
            comment:result
        }

        );
    }
    catch(error){
        res.status(500).json({error:error.message
            ,message : "can't fetch child comment "
        })
    }

});



app.listen(8000, async () => {
    await waitconnection();
    console.log("Server running on port 8000");

});


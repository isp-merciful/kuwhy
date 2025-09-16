const express = require('express');
const router = express.Router();

let wire = null;

function DBconnect(val){
    wire = val;
}

function CommentTree(comments) {
  const map = {};
  const roots = [];

  comments.forEach(c => {
    map[c.comment_id] = { ...c, children: [] };
  });


  comments.forEach(c => {
    if (c.parent_comment_id) {
      if (map[c.parent_comment_id]) {
        map[c.parent_comment_id].children.push(map[c.comment_id]);
      }
    } else {
      roots.push(map[c.comment_id]);
    }
  });


  roots.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  function sortChildren(node) {
    if (!node.children || node.children.length === 0) return;
    node.children.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    node.children.forEach(sortChildren);
  }

  roots.forEach(sortChildren);
  return roots;
}

router.get('/', async (req, res) => {
  try {
    const [result] = await wire.query(
      `SELECT * from comment`
    );

    const commentTree = CommentTree(result);

    res.json({
      message: "getallcomment",
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

router.delete('/:id', async(req,res) => {
    try{
      const [result] = await wire.query(
        'delete from comment where comment_id = ?',[req.params.id]
      )
    res.json('delete success');
    }catch(error){
        console.error(error);
        res.status(500).json({
            error:"can't deleted "
        })
    }
});




router.get('/note/:note_id', async (req, res) => {
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

router.put('/', async (req, res) => {
  try {
    const { message,comment_id } = req.body;
    const [result] = await wire.query(
      `UPDATE comment SET message = ? WHERE comment_id = ?`,[message,comment_id]);
    res.json({
      message : "updatesuccess"
    })
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update user name" });
  }
});





router.post('/', async (req, res) => {
  try {
    const { user_id,message,blog_id,note_id,parent_comment_id } = req.body;

    if (!user_id || !message) {
      throw new Error('ไม่มี notes หรือ username');
    }
    

    const [result] = await wire.query(
      'INSERT INTO comment (user_id, message, blog_id,note_id,parent_comment_id) VALUES (?, ?, ?, ?, ?)',
      [user_id, message, blog_id || null,note_id || null ,parent_comment_id || null]
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

module.exports = { router, DBconnect };
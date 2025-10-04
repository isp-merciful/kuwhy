const express = require('express');
const router = express.Router();

let wire = null;

function DBconnect(val) {
  wire = val;
}

// CREATE
router.post('/', async (req, res) => {
  try {
    const { user_id, blog_title, message } = req.body;

    // mysql2/promise returns [result, fields]; insertId is on result
    const [result] = await wire.query(
      'INSERT INTO blog (user_id, blog_title, message) VALUES (?, ?, ?)',
      [user_id, blog_title, message]
    );

    res.json({
      message: 'inserted',
      insertedId: result.insertId,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Database insert failed' });
  }
});

// LIST (all)
router.get('/', async (req, res) => {
  try {
    const [rows] = await wire.query(
      `SELECT 
         b.blog_id,
         b.blog_title,
         b.message,
         b.blog_up,
         b.blog_down,
         u.img,
         u.user_name,
         b.created_at
       FROM blog b
       LEFT JOIN users u ON b.user_id = u.user_id
       ORDER BY b.blog_id DESC`
    );

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'fetch post fail' });
  }
});

// GET by ID (single)
router.get('/:id', async (req, res) => {
  try {
    const blogId = req.params.id;

    const [rows] = await wire.query(
      `SELECT 
         b.blog_id,
         b.blog_title,
         b.message,
         b.blog_up,
         b.blog_down,
         u.img,
         u.user_name,
         b.created_at
       FROM blog b
       LEFT JOIN users u ON b.user_id = u.user_id
       WHERE b.blog_id = ?
       LIMIT 1`,
      [blogId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Not found' });
    }

    // Frontend helper uses json?.data ?? json, so wrap in { data: ... }
    return res.json({ data: rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'fetch post by id failed' });
  }
});

// UPDATE message
router.put('/', async (req, res) => {
  try {
    const { message, blog_id } = req.body;
    const [result] = await wire.query(
      `UPDATE blog SET message = ? WHERE blog_id = ?`,
      [message, blog_id]
    );
    res.json({ message: 'updatesuccess' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update user name' });
  }
});

// DELETE
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await wire.query(
      'DELETE FROM blog WHERE blog_id = ?',
      [req.params.id]
    );
    res.json('delete success');
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "can't deleted blog",
    });
  }
});

module.exports = { router, DBconnect };

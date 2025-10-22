const express = require('express');
const router = express.Router();

let wire = null;
function DBconnect(val){ wire = val; }

/* CREATE — require explicit user_id (no anonymous mode) */
router.post('/', async (req, res) => {
  try {
    let { user_id, blog_title, message } = req.body;
    if (!blog_title?.trim()) return res.status(400).json({ error: 'blog_title is required' });
    if (!message?.trim()) return res.status(400).json({ error: 'message is required' });
    if (!user_id || typeof user_id !== 'string' || !user_id.trim()) {
      return res.status(400).json({ error: 'user_id is required' });
    }
    const actualUser = user_id.trim();

    await wire.query(
      "INSERT INTO users (user_id, user_name) VALUES (?, ?) ON DUPLICATE KEY UPDATE user_name = VALUES(user_name)",
      [actualUser, "Guest"]
    );

    const [result] = await wire.query(
      'INSERT INTO blog (user_id, blog_title, message) VALUES (?, ?, ?)',
      [actualUser, blog_title.trim(), message.trim()]
    );
    res.json({ message: 'inserted', insertedId: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'create blog failed' });
  }
});

/* READ LIST */
router.get('/', async (req, res) => {
  try {
    const [rows] = await wire.query(
      `SELECT b.*, u.user_name, u.img
         FROM blog b
         LEFT JOIN users u ON b.user_id = u.user_id
        ORDER BY b.created_at DESC`
    );
    res.json({ message: 'getall', data: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'fetch all failed' });
  }
});

/* READ ONE */
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await wire.query(
      `SELECT b.*, u.user_name, u.img
         FROM blog b
         LEFT JOIN users u ON b.user_id = u.user_id
        WHERE b.blog_id = ?
        LIMIT 1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Not found' });
    res.json({ data: rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'fetch post by id failed' });
  }
});

/* UPDATE */
router.put('/', async (req, res) => {
  try {
    const { message, blog_id } = req.body;
    await wire.query('UPDATE blog SET message = ? WHERE blog_id = ?', [message, blog_id]);
    res.json({ message: 'updatesuccess' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update blog' });
  }
});

/* DELETE */
router.delete('/:id', async (req, res) => {
  try {
    await wire.query('DELETE FROM blog WHERE blog_id = ?', [req.params.id]);
    res.json('delete success');
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "can't deleted blog" });
  }
});

/* VOTE — unchanged simple counters */
router.post('/:id/vote-simple', async (req, res) => {
  try {
    const { vote } = req.body; // 'up' | 'down' | null
    const id = Number(req.params.id);

    const [[row]] = await wire.query('SELECT blog_up, blog_down FROM blog WHERE blog_id = ? LIMIT 1', [id]);
    if (!row) return res.status(404).json({ error: 'blog not found' });

    let up = row.blog_up ?? 0;
    let down = row.blog_down ?? 0;

    let next = null;
    if (vote === 'up') { up += 1; next = 'up'; }
    else if (vote === 'down') { down += 1; next = 'down'; }

    await wire.query('UPDATE blog SET blog_up = ?, blog_down = ? WHERE blog_id = ?', [up, down, id]);

    res.json({
      vote: next,
      blog_up: row.blog_up ?? 0,
      blog_down: row.blog_down ?? 0,
    });
  } catch (err) {
    console.error('vote-simple error', err);
    res.status(500).json({ error: 'vote failed' });
  }
});

module.exports = { router, DBconnect };

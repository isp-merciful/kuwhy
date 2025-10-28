const express = require('express');
const router = express.Router();

let wire = null;
function DBconnect(val){ wire = val; }

/* ------------ CRUD ------------ */

router.post('/', async (req, res) => {
  try {
    const { user_id, blog_title, message } = req.body;
    const [result] = await wire.query(
      'INSERT INTO blog (user_id, blog_title, message) VALUES (?, ?, ?)',
      [user_id, blog_title, message]
    );
    res.json({ message: 'inserted', insertedId: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Database insert failed' });
  }
});

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

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await wire.query(
      `SELECT 
         b.blog_id,
         b.user_id,
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
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Not found' });
    res.json({ data: rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'fetch post by id failed' });
  }
});

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

router.delete('/:id', async (req, res) => {
  try {
    await wire.query('DELETE FROM blog WHERE blog_id = ?', [req.params.id]);
    res.json('delete success');
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "can't deleted blog" });
  }
});

/* ------------ NO-MIGRATION VOTING (state + localStorage) ------------ */
/**
 * Client sends:
 *   { prev: "up"|"down"|null, next: "up"|"down"|null }
 * Server computes deltas and updates blog_up/blog_down atomically.
 */
router.post('/:id/vote-simple', async (req, res) => {
  try {
    const id = req.params.id;
    let { prev, next } = req.body || {};
    const norm = (v) => (v === 'up' || v === 'down' ? v : null);
    prev = norm(prev);
    next = norm(next);

    let upDelta = 0, downDelta = 0;
    if (prev !== next) {
      if (prev === null && next === 'up') upDelta = +1;
      else if (prev === null && next === 'down') downDelta = +1;
      else if (prev === 'up' && next === null) upDelta = -1;
      else if (prev === 'down' && next === null) downDelta = -1;
      else if (prev === 'up' && next === 'down') { upDelta = -1; downDelta = +1; }
      else if (prev === 'down' && next === 'up') { downDelta = -1; upDelta = +1; }
    }

    await wire.query(
      `UPDATE blog
         SET blog_up   = GREATEST(IFNULL(blog_up,0)   + ?, 0),
             blog_down = GREATEST(IFNULL(blog_down,0) + ?, 0)
       WHERE blog_id = ?`,
      [upDelta, downDelta, id]
    );

    const [[row]] = await wire.query(
      `SELECT blog_up, blog_down FROM blog WHERE blog_id = ? LIMIT 1`,
      [id]
    );
    if (!row) return res.status(404).json({ error: 'not found' });

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


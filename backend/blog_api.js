const express = require('express');
const router = express.Router();
const { prisma } = require('./lib/prisma.cjs');


router.post('/', async (req, res) => {
  try {
    const { user_id, blog_title, message } = req.body;

    const result = await prisma.blog.create({
      data: {
        user_id,
        blog_title,
        message,
      },
    });

    res.json({
      message: 'inserted',
      insertedId: result.blog_id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Database insert failed' });
  }
});


router.get('/', async (req, res) => {
  try {
    const result = await prisma.blog.findMany({
      orderBy: { blog_id: 'desc' },
      include: {
        users: {
          select: {
            img: true,
            user_name: true,
          },
        },
      },
    });


    const blogs = result.map(b => ({
      blog_id: b.blog_id,
      blog_title: b.blog_title,
      message: b.message,
      img: b.user?.img,
      user_name: b.user?.user_name,
      created_at: b.created_at,
    }));

    res.json(blogs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'fetch post fail' });
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

router.put('/', async (req, res) => {
  try {
    const { message, blog_id } = req.body;

    await prisma.blog.update({
      where: { blog_id: blog_id },
      data: { message },
    });

    res.json({ message: 'updatesuccess' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update blog" });
  }
});


router.delete('/:id', async (req, res) => {
  try {
    await prisma.blog.delete({
      where: { blog_id: Number(req.params.id) },
    });

    res.json('delete success');
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "can't deleted blog" });
  }
});

module.exports = router;

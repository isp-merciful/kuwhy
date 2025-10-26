const express = require('express');
const router = express.Router();
const { prisma } = require('../lib/prisma.cjs');


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

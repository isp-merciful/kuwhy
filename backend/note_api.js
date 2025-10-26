const express = require("express");
const { prisma } = require('../lib/prisma.cjs');
const router = express.Router();



router.get("/", async (req, res) => {
  try {
    const notes = await prisma.note.findMany({
      orderBy: { note_id: "desc" },
      include: {
        users: {
          select: {
            user_id: true,
            user_name: true,
            img: true,
          },
        },
      },
    });
    res.json(notes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "fetch post fail" });
  }

});


router.get("/:id", async (req, res) => {
  const noteId = parseInt(req.params.id, 10);
  try {
    const note = await prisma.note.findUnique({
      where: { note_id: noteId },
      include: {
        users: {
          select: {
            user_id: true,
            user_name: true,
            img: true,
          },
        },
      },
    });

    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }

    res.json(note);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Fetch note failed" });
  }
});


router.get("/user/:id", async (req, res) => {
  const userId = req.params.id;
  try {
    const note = await prisma.note.findMany({
      where: { user_id: userId }
    });

    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }

    res.json(note[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Fetch note failed" });
  }
});


router.post("/", async (req, res) => {

  try {
    const { message, user_id } = req.body;

    if (!message) {
      return res.status(400).json({ error: "ไม่มี notes" });
    }
    if (!user_id) {
      return res.status(400).json({ error: "Missing user_id" });
    }

    const newNote = await prisma.note.create({
      data: {
        message,
        users: { connect: { user_id: user_id } }, // เชื่อมกับ user
      },
    });

    res.status(201).json({
      message: "add note success",
      value: newNote,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "add notes fail" });
  }
});

router.delete("/:id", async (req, res) => {
  const noteId = parseInt(req.params.id, 10);
  try {
    await prisma.note.delete({
      where: { note_id: noteId },
    });
    res.json("delete success");
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "can't deleted" });
  }
});

module.exports = router;

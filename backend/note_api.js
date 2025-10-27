// backend/note_api.js
'use strict';

const express = require('express');
// ✅ ใช้ Prisma singleton เดียวกันทั้งแอป
const { prisma } = require('./lib/prisma.cjs');

const router = express.Router();

const toInt = (v, def = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : def;
};

/**
 * GET /api/note
 * รายการโน้ตทั้งหมด (ใหม่สุดก่อน)
 * รวมข้อมูลผู้โพสต์ (user_id, user_name, img)
 */
router.get('/', async (req, res) => {
  try {
    const notes = await prisma.note.findMany({
      orderBy: { note_id: 'desc' },
      include: {
        users: { select: { user_id: true, user_name: true, img: true } },
      },
    });

    // ทำให้ crr_party เป็น number ชัด ๆ
    const data = notes.map(n => ({
      ...n,
      crr_party: toInt(n.crr_party, 0),
    }));

    res.json(data);
  } catch (error) {
    console.error('❌ fetch post fail:', error);
    res.status(500).json({ error: 'fetch post fail' });
  }
});

/**
 * ⚠️ วาง /user/:id ก่อน /:id เพื่อไม่ให้ชน route
 *
 * GET /api/note/user/:id
 * โน้ตทั้งหมดของผู้ใช้คนหนึ่ง (ส่งกลับเป็น array)
 */
router.get('/user/:id', async (req, res) => {
  const userId = req.params.id;
  try {
    const notes = await prisma.note.findMany({
      where: { user_id: userId },
      orderBy: { note_id: 'desc' },
      include: {
        users: { select: { user_id: true, user_name: true, img: true } },
      },
    });

    const data = notes.map(n => ({
      ...n,
      crr_party: toInt(n.crr_party, 0),
    }));

    res.json(data); // ส่ง array ให้แน่นอน
  } catch (error) {
    console.error('❌ Fetch note by user failed:', error);
    res.status(500).json({ error: 'Fetch note by user failed' });
  }
});

/**
 * GET /api/note/:id
 * ดึงโน้ตเดี่ยว
 */
router.get('/:id', async (req, res) => {
  const noteId = toInt(req.params.id, null);
  if (noteId === null) return res.status(400).json({ error: 'invalid id' });

  try {
    const note = await prisma.note.findUnique({
      where: { note_id: noteId },
      include: {
        users: { select: { user_id: true, user_name: true, img: true } }, // ✅ มีรูปผู้โพสต์
      },
    });

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json({ ...note, crr_party: toInt(note.crr_party, 0) });
  } catch (error) {
    console.error('❌ Fetch note failed:', error);
    res.status(500).json({ error: 'Fetch note failed' });
  }
});

/**
 * POST /api/note
 * สร้างโน้ตใหม่
 * - ถ้ามี max_party > 0 ให้เริ่ม crr_party = 1 (นับเจ้าของห้อง)
 * - รวมข้อมูลผู้โพสต์กลับไปด้วย
 */
router.post('/', async (req, res) => {
  try {
    const { message, user_id, max_party } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'missing message' });
    }
    if (!user_id) {
      return res.status(400).json({ error: 'missing user_id' });
    }

    const mp = Number.isFinite(Number(max_party)) ? Number(max_party) : null;
    const crr_party = mp && mp > 0 ? 1 : 0;

    const newNote = await prisma.note.create({
      data: {
        message,
        users: { connect: { user_id } },
        ...(mp !== null ? { max_party: mp } : {}), // ใส่ต่อเมื่อเป็นตัวเลขจริง
        crr_party,
      },
      include: {
        users: { select: { user_id: true, user_name: true, img: true } }, // ✅ รูปผู้โพสต์
      },
    });

    res.status(201).json({
      message: 'add note success',
      value: { ...newNote, crr_party: toInt(newNote.crr_party, 0) },
    });
  } catch (error) {
    console.error('❌ add notes fail:', error);
    res.status(500).json({ error: 'add notes fail' });
  }
});

/**
 * DELETE /api/note/:id
 * ลบโน้ต
 */
router.delete('/:id', async (req, res) => {
  const noteId = toInt(req.params.id, null);
  if (noteId === null) return res.status(400).json({ error: 'invalid id' });

  try {
    await prisma.note.delete({ where: { note_id: noteId } });
    res.json('delete success');
  } catch (error) {
    console.error('❌ delete note fail:', error);
    res.status(500).json({ error: "can't deleted" });
  }
});

/**
 * POST /api/note/join
 * เพิ่มสมาชิกเข้าปาร์ตี้ + เพิ่ม crr_party
 * - ป้องกันซ้ำ
 * - ไม่ให้เกิน max_party (ถ้ามี)
 */
router.post('/join', async (req, res) => {
  try {
    const note_id = toInt(req.body.note_id, null);
    const user_id = req.body.user_id;

    if (note_id === null || !user_id) {
      return res.status(400).json({ error: 'missing note_id or user_id' });
    }

    const note = await prisma.note.findUnique({
      where: { note_id },
      select: { note_id: true, max_party: true, crr_party: true },
    });
    if (!note) return res.status(404).json({ error: 'Note not found' });

    const maxParty = note.max_party ?? null;
    const currentParty = toInt(note.crr_party, 0);

    // เช็คซ้ำ
    const already = await prisma.party_members.findFirst({
      where: { note_id, user_id },
      select: { id: true },
    });
    if (already) {
      return res.json({
        success: true,
        message: 'already joined',
        data: { ...note, crr_party: currentParty },
      });
    }

    // เช็คความจุ (ถ้ามี max_party)
    if (maxParty !== null && currentParty >= maxParty) {
      return res.status(409).json({ error: 'party is full' });
    }

    // สร้างสมาชิก + เพิ่ม crr_party ใน transaction
    const updated = await prisma.$transaction(async (tx) => {
      await tx.party_members.create({
        data: { note_id, user_id },
      });

      const noteUpd = await tx.note.update({
        where: { note_id },
        data: { crr_party: { increment: 1 } },
        include: {
          users: { select: { user_id: true, user_name: true, img: true } },
        },
      });

      return noteUpd;
    });

    res.json({
      success: true,
      message: 'Added new party member and incremented party count.',
      data: { ...updated, crr_party: toInt(updated.crr_party, 0) },
    });
  } catch (error) {
    console.error('❌ join party fail:', error);
    res.status(500).json({ error: 'Failed to add new party member and increment party count.' });
  }
});

module.exports = router;

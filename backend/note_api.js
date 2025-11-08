// backend/note_api.js
const express = require("express");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const router = express.Router();

/* =========================================
 * GET /api/note
 * รายการโน้ตทั้งหมด (ใหม่อยู่บน)
 * ========================================= */
router.get("/", async (req, res) => {
  try {
    const notes = await prisma.note.findMany({
      orderBy: { note_id: "desc" },
      include: {
        users: { select: { user_id: true, user_name: true, img: true } },
      },
    });
    res.json(notes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "fetch post fail" });
  }
});

/* =========================================
 * GET /api/note/user/:id
 * โน้ตล่าสุดของ user
 * - ถ้าไม่มีโน้ตของตัวเอง → fallback ไปโน้ตของปาร์ตี้ที่ user เคย join ล่าสุด
 * - ถ้าไม่มีเลย → 200 { note: null }
 * ========================================= */
router.get("/user/:id", async (req, res) => {
  const userId = req.params.id;
  try {
    // 1) โน้ตที่ผู้ใช้ "โพสต์เอง" ล่าสุด
    const ownNote = await prisma.note.findFirst({
      where: { user_id: userId },
      orderBy: { note_id: "desc" },
    });
    if (ownNote) return res.json(ownNote);

    // 2) ไม่มี → หา membership ล่าสุดที่เคย join
    const lastMembership = await prisma.party_members.findFirst({
      where: { user_id: userId },
      orderBy: { id: "desc" }, // ถ้ามี created_at ใช้อันนั้นได้
      select: { note_id: true },
    });

    if (!lastMembership) {
      return res.json({ note: null });
    }

    // 3) ดึงโน้ตที่เคย join ล่าสุด
    const joinedNote = await prisma.note.findUnique({
      where: { note_id: lastMembership.note_id },
      // ต้องการ users? เปิดคอมเมนต์ข้างล่างได้
      // include: { users: { select: { user_id: true, user_name: true, img: true } } },
    });

    if (!joinedNote) return res.json({ note: null });

    // 4) ระบุว่าเป็นโน้ตที่ได้จากการเข้าร่วม ไม่ใช่ของตัวเอง
    return res.json({
      ...joinedNote,
      joined_member_only: true,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Fetch note failed" });
  }
});

/* =========================================
 * GET /api/note/:id
 * ========================================= */
router.get("/:id", async (req, res) => {
  const noteId = parseInt(req.params.id, 10);
  try {
    const note = await prisma.note.findUnique({
      where: { note_id: noteId },
      include: {
        users: { select: { user_id: true, user_name: true, img: true } },
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

/* =========================================
 * POST /api/note
 * - upsert ผู้ใช้ก่อน → ป้องกัน P2025
 * - บังคับ max_party: 0 หรือ [2..20]
 * - ถ้าเป็นปาร์ตี้ → crr_party = 1 (นับคนโพสต์)
 * ========================================= */
router.post("/", async (req, res) => {
  try {
    const { message, user_id } = req.body;
    let { max_party } = req.body;

    if (!message) {
      return res.status(400).json({ error: "ไม่มี notes" });
    }
    if (!user_id) {
      return res.status(400).json({ error: "Missing user_id" });
    }

    // Clean & enforce: 0 (ไม่ใช่ปาร์ตี้) หรือ [2..20]
    max_party = Number(max_party) || 0;
    if (max_party > 0) {
      max_party = Math.min(20, Math.max(2, Math.floor(max_party)));
    } else {
      max_party = 0;
    }
    const crr_party = max_party > 0 ? 1 : 0;

    // ✅ ป้องกัน P2025: ให้แน่ใจว่ามี users record เสมอ
    await prisma.users.upsert({
      where: { user_id },
      update: {},
      create: { user_id, user_name: "anonymous" }, // เติม field ที่จำเป็นอื่น ๆ ถ้ามี
    });

    const newNote = await prisma.note.create({
      data: {
        message,
        max_party,
        crr_party,
        users: { connect: { user_id } },
      },
    });

    res.status(201).json({
      message: "add note success",
      note_id: newNote.note_id,
      note: newNote,
      value: newNote, // backward compatibility
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "add notes fail" });
  }
});

/* =========================================
 * DELETE /api/note/:id
 * (หมายเหตุ: endpoint นี้ยังไม่เช็ค owner)
 * ========================================= */
router.delete("/:id", async (req, res) => {
  const noteId = parseInt(req.params.id, 10);
  try {
    await prisma.note.delete({ where: { note_id: noteId } });
    res.json("delete success");
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "can't deleted" });
  }
});

/* =========================================
 * POST /api/note/join
 * - upsert ผู้ใช้
 * - ตรวจว่าเป็นปาร์ตี้/ไม่เต็ม
 * - กันซ้ำ: ถ้าเป็นสมาชิกอยู่แล้ว → 200 success + message
 * - ทำในธุรกรรมเดียว ลด race
 * ========================================= */
router.post("/join", async (req, res) => {
  try {
    const { note_id, user_id } = req.body;

    if (!note_id || !user_id) {
      return res.status(400).json({ error: "Missing note_id or user_id" });
    }

    // ✅ ให้มีผู้ใช้เสมอ (กรณี join โดยยังไม่เคย register)
    await prisma.users.upsert({
      where: { user_id },
      update: {},
      create: { user_id, user_name: "anonymous" },
    });

    // ดึงโน้ต
    const note = await prisma.note.findUnique({
      where: { note_id: Number(note_id) },
      select: { note_id: true, max_party: true, crr_party: true },
    });
    if (!note) return res.status(404).json({ error: "Note not found" });
    if (!note.max_party || note.max_party <= 0) {
      return res.status(400).json({ error: "This note is not a party." });
    }

    // เช็คเป็นสมาชิกแล้ว?
    const existing = await prisma.party_members.findFirst({
      where: { note_id: Number(note_id), user_id },
      select: { id: true },
    });
    if (existing) {
      return res.json({
        success: true,
        message: "Already a member of this party.",
        data: note, // ส่งสถานะปัจจุบัน
      });
    }

    // เช็คเต็ม
    if (note.crr_party >= note.max_party) {
      return res.status(400).json({ error: "Party is full" });
    }

    // ทำธุรกรรม: สร้างสมาชิก + เพิ่ม crr_party
    const [_, updatedNote] = await prisma.$transaction([
      prisma.party_members.create({
        data: { note_id: Number(note_id), user_id },
      }),
      prisma.note.update({
        where: {
          note_id: Number(note_id),
        },
        data: { crr_party: { increment: 1 } },
      }),
    ]);

    res.json({
      success: true,
      message: "Added new party member and incremented party count.",
      data: updatedNote,
    });
  } catch (error) {
    console.error(error);

    // กรณี unique constraint ที่ party_members (ถ้าคุณตั้ง @@unique([note_id, user_id]))
    // จะวิ่งเข้า error นี้ → ถือว่าเป็นสมาชิกแล้ว
    if (error?.code === "P2002") {
      return res.json({
        success: true,
        message: "Already a member of this party.",
      });
    }

    res.status(500).json({
      error: "Failed to add new party member and incremented party count.",
    });
  }
});


router.post("/leave", async (req, res) => {
  try {
    const { note_id, user_id } = req.body;
    if (!note_id || !user_id) {
      return res.status(400).json({ error: "Missing note_id or user_id" });
    }

    const note = await prisma.note.findUnique({
      where: { note_id: Number(note_id) },
      select: { note_id: true, max_party: true, crr_party: true, user_id: true },
    });
    if (!note) return res.status(404).json({ error: "Note not found" });
    if (!note.max_party || note.max_party <= 0) {
      return res.status(400).json({ error: "This note is not a party." });
    }
    // เจ้าของห้องไม่อนุญาตให้ออก (ต้องลบโน้ตแทน)
    if (note.user_id === user_id) {
      return res.status(400).json({ error: "Owner cannot leave. Delete the note instead." });
    }

    const membership = await prisma.party_members.findFirst({
      where: { note_id: Number(note_id), user_id },
      select: { id: true },
    });
    if (!membership) {
      // ไม่ได้เป็นสมาชิกอยู่แล้ว ถือว่าสำเร็จแบบปลอดภัย
      return res.json({ success: true, message: "Already not a member.", data: note });
    }

    const [, updatedNote] = await prisma.$transaction([
      prisma.party_members.delete({ where: { id: membership.id } }),
      prisma.note.update({
        where: { note_id: Number(note_id) },
        data: {
          crr_party: note.crr_party > 0 ? { decrement: 1 } : undefined,
        },
      }),
    ]);

    // ถ้า client มีแนวคิด active note ฝั่งผู้ใช้ อาจเคลียร์ได้ด้วย (ปล่อยไว้เฉย ๆ ก็ได้)
    // await prisma.users.updateMany({ where: { active_note_id: Number(note_id), user_id }, data: { active_note_id: null } });

    res.json({
      success: true,
      message: "Left the party.",
      data: updatedNote,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to leave party" });
  }
});


router.get("/party/is-member", async (req, res) => {
  try {
    const note_id = Number(req.query.note_id);
    const user_id = String(req.query.user_id || "");
    if (!Number.isFinite(note_id) || !user_id) {
      return res.status(400).json({ error: "Missing or invalid note_id/user_id" });
    }

    const note = await prisma.note.findUnique({
      where: { note_id },
      select: { note_id: true, max_party: true, crr_party: true, owner_id: true },
    });
    if (!note) return res.status(404).json({ error: "Note not found" });

    // owner = member by definition
    if (note.owner_id && note.owner_id === user_id) {
      return res.json({
        is_member: true,
        is_owner: true,
        crr_party: note.crr_party,
        max_party: note.max_party,
      });
    }

    const member = await prisma.party_members.findFirst({
      where: { note_id, user_id },
      select: { id: true },
    });

    res.json({
      is_member: !!member,
      is_owner: false,
      crr_party: note.crr_party,
      max_party: note.max_party,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Check member failed" });
  }
});


module.exports = router;
// backend/note_api.js
const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { optionalAuth, requireMember } = require("./auth_mw");
const prisma = new PrismaClient();
const router = express.Router();

/** ------------------------------------------
 * helper: ตัดสินว่า "ใคร" เป็นคนยิงคำสั่ง
 * - ถ้ามี req.user.id (ผ่าน optionalAuth/requireMember) → ใช้เป็นผู้กระทำ (auth)
 * - ถ้าไม่มี → ใช้ user_id จาก body เป็น anonymous
 *   (หมายเหตุ: ฝั่ง create note แบบ party จะบังคับต้องเป็น auth เท่านั้น)
 * ------------------------------------------ */
function resolveActor(req) {
  if (req.user?.id) return { id: String(req.user.id), mode: "auth" };
  const bodyId = String(req.body?.user_id || "").trim();
  if (!bodyId) return null; // ไม่รู้ว่าใครเลย
  return { id: bodyId, mode: "anon" };
}

/** ------------------------------------------
 * helper: upsert users ให้มีเสมอ (กัน P2025)
 * - สำหรับ anonymous: จะมี row ที่ user_id = anonId, role=anonymous (แล้วแต่ schema คุณ)
 * - สำหรับ auth: ปกติควรมีอยู่แล้วจากระบบสมัคร/ล็อกอิน แต่ upsert ก็ harmless
 * ------------------------------------------ */
async function ensureUserExists(user_id, isAnon = false) {
  await prisma.users.upsert({
    where: { user_id },
    update: {}, // ไม่เปลี่ยนชื่ออัตโนมัติใน upsert
    create: {
      user_id,
      user_name: isAnon ? "anonymousAA" : "anonymousBBB", // ดีฟอลต์เป็น anonymous ไปก่อน
      role: isAnon ? "anonymous" : "member",         // ถ้าเป็นผู้ใช้ยืนยันตัวตน ตั้ง role=member
      img: "/images/pfp.png",
      gender: "Not_Specified",
      email: null,
    },
  });
}

/* =========================================
 * GET /api/note
 * ========================================= */
router.get("/", async (_req, res) => {
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
 * ล่าสุดของ user (own → last joined)
 * ========================================= */
router.get("/user/:id", async (req, res) => {
  const userId = req.params.id;
  try {
    const ownNote = await prisma.note.findFirst({
      where: { user_id: userId }, // 🔧 CHANGED: ใช้คอลัมน์ user_id ให้เสมอต้นเสมอปลาย
      orderBy: { note_id: "desc" },
    });
    if (ownNote) return res.json(ownNote);

    const lastMembership = await prisma.party_members.findFirst({
      where: { user_id: userId },
      orderBy: { id: "desc" },
      select: { note_id: true },
    });
    if (!lastMembership) return res.json({ note: null });

    const joinedNote = await prisma.note.findUnique({
      where: { note_id: lastMembership.note_id },
    });
    if (!joinedNote) return res.json({ note: null });

    return res.json({ ...joinedNote, joined_member_only: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Fetch note failed" });
  }
});

/* =========================================
 * GET /api/note/:id
 * ========================================= */
router.get("/:id", async (req, res) => {
  const noteId = Number(req.params.id);
  try {
    const note = await prisma.note.findUnique({
      where: { note_id: noteId },
      include: {
        users: { select: { user_id: true, user_name: true, img: true } },
      },
    });
    if (!note) return res.status(404).json({ error: "Note not found" });
    res.json(note);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Fetch note failed" });
  }
});

/* =========================================
 * POST /api/note
 * - ทับตัวตนด้วย req.user.id เมื่อมี (กันโพสเป็น anonymous ทั้งที่ล็อกอิน)
 * - party note ต้องล็อกอินเท่านั้น
 * - upsert users กัน P2025
 * ========================================= */
router.post("/", optionalAuth, async (req, res) => {
  try {
    const { message } = req.body;
    let { max_party } = req.body;
   // ถ้าส่ง Bearer มา แต่ verify ไม่ผ่าน → ปัดตกเลย (กันตกไป anon)
   const hasBearer = typeof req.headers.authorization === "string" &&
                     req.headers.authorization.startsWith("Bearer ");
   if (hasBearer && !req.user) {
     return res.status(401).json({ error: "Invalid or expired token" });
   }

    if (!message || String(message).trim() === "") {
      return res.status(400).json({ error: "ไม่มี notes" });
    }

    // Clean & enforce: 0 หรือ [2..20]
    max_party = Number(max_party) || 0;
    if (max_party > 0) {
      max_party = Math.min(20, Math.max(2, Math.floor(max_party)));
    } else {
      max_party = 0;
    }

    // ตัดสิน "ผู้โพส"
    const actor = resolveActor(req);
    if (!actor) return res.status(401).json({ error: "Missing user identity" });

    // 🔧 CHANGED: party ต้องล็อกอิน
    if (max_party > 0 && actor.mode === "anon") {
      return res.status(401).json({ error: "Party note requires login" });
    }

    // ✅ สร้าง/คงอยู่ของผู้ใช้เสมอ
    await ensureUserExists(actor.id, actor.mode === "anon");

    // นับคนโพสต์กรณีเป็นปาร์ตี้
    const crr_party = max_party > 0 ? 1 : 0;

    // 🔧 CHANGED: บังคับใช้ actor.id เป็นเจ้าของเสมอ (ทับ user_id จาก client)
    const newNote = await prisma.note.create({
      data: {
        message: String(message),
        max_party,
        crr_party,
        user_id: actor.id,              // <— เจ้าของโพส (owner)
        // users: { connect: { user_id: actor.id } }, // ความสัมพันธ์ (ถ้า schema กำหนด relation ชื่อ users)
      },
    });

    res.status(201).json({
      message: "add note success",
      note_id: newNote.note_id,
      note: newNote,
      value: newNote, // BC
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "add notes fail" });
  }
});

/* =========================================
 * DELETE /api/note/:id
 * - 🔧 CHANGED: จำกัดเฉพาะเจ้าของที่ล็อกอินเท่านั้น
 * ========================================= */
router.delete("/:id", optionalAuth, async (req, res) => {
  try {
    const noteId = Number(req.params.id);
    const actorId = req.user?.id;
    if (!actorId) return res.status(401).json({ error: "Login required" });

    const note = await prisma.note.findUnique({
      where: { note_id: noteId },
      select: { note_id: true, user_id: true },
    });
    if (!note) return res.status(404).json({ error: "Note not found" });
    if (note.user_id !== actorId) {
      return res.status(403).json({ error: "Not the owner" });
    }

    await prisma.note.delete({ where: { note_id: noteId } });
    res.json("delete success");
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "can't deleted" });
  }
});

/* =========================================
 * POST /api/note/join
 * - requireMember: ต้องล็อกอิน
 * - 🔧 CHANGED: ทับ user_id ด้วย req.user.id เสมอ
 * ========================================= */
router.post("/join", requireMember, async (req, res) => {
  try {
    const note_id = Number(req.body.note_id);
    const user_id = String(req.user.id); // <— ทับเสมอ

    if (!Number.isFinite(note_id)) {
      return res.status(400).json({ error: "Missing or invalid note_id" });
    }

    await ensureUserExists(user_id, false);

    const note = await prisma.note.findUnique({
      where: { note_id },
      select: { note_id: true, max_party: true, crr_party: true },
    });
    if (!note) return res.status(404).json({ error: "Note not found" });
    if (!note.max_party || note.max_party <= 0) {
      return res.status(400).json({ error: "This note is not a party." });
    }

    const existing = await prisma.party_members.findFirst({
      where: { note_id, user_id },
      select: { id: true },
    });
    if (existing) {
      return res.json({
        success: true,
        message: "Already a member of this party.",
        data: note,
      });
    }

    if (note.crr_party >= note.max_party) {
      return res.status(400).json({ error: "Party is full" });
    }

    const [_, updatedNote] = await prisma.$transaction([
      prisma.party_members.create({ data: { note_id, user_id } }),
      prisma.note.update({
        where: { note_id },
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
    if (error?.code === "P2002") {
      return res.json({ success: true, message: "Already a member of this party." });
    }
    res.status(500).json({
      error: "Failed to add new party member and incremented party count.",
    });
  }
});

/* =========================================
 * POST /api/note/leave
 * - requireMember: ต้องล็อกอิน
 * - 🔧 CHANGED: ทับ user_id ด้วย req.user.id เสมอ
 * ========================================= */
router.post("/leave", requireMember, async (req, res) => {
  try {
    const note_id = Number(req.body.note_id);
    const user_id = String(req.user.id); // <— ทับเสมอ

    if (!Number.isFinite(note_id)) {
      return res.status(400).json({ error: "Missing or invalid note_id" });
    }

    const note = await prisma.note.findUnique({
      where: { note_id },
      select: { note_id: true, max_party: true, crr_party: true, user_id: true },
    });
    if (!note) return res.status(404).json({ error: "Note not found" });
    if (!note.max_party || note.max_party <= 0) {
      return res.status(400).json({ error: "This note is not a party." });
    }
    if (note.user_id === user_id) {
      return res.status(400).json({ error: "Owner cannot leave. Delete the note instead." });
    }

    const membership = await prisma.party_members.findFirst({
      where: { note_id, user_id },
      select: { id: true },
    });
    if (!membership) {
      return res.json({ success: true, message: "Already not a member.", data: note });
    }

    const [, updatedNote] = await prisma.$transaction([
      prisma.party_members.delete({ where: { id: membership.id } }),
      prisma.note.update({
        where: { note_id },
        data: { crr_party: note.crr_party > 0 ? { decrement: 1 } : undefined },
      }),
    ]);

    res.json({ success: true, message: "Left the party.", data: updatedNote });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to leave party" });
  }
});

/* =========================================
 * GET /api/note/party/is-member
 * - requireMember: ต้องล็อกอิน
 * - 🔧 CHANGED: ใช้ req.user.id เป็นหลัก
 * - 🔧 CHANGED: อ้าง owner ด้วย field user_id (ให้สอดคล้องกับ create)
 * ========================================= */
router.get("/party/is-member", requireMember, async (req, res) => {
  try {
    const note_id = Number(req.query.note_id);
    const user_id = String(req.user.id); // <— ทับเสมอ
    if (!Number.isFinite(note_id)) {
      return res.status(400).json({ error: "Missing or invalid note_id" });
    }

    const note = await prisma.note.findUnique({
      where: { note_id },
      select: { note_id: true, max_party: true, crr_party: true, user_id: true },
    });
    if (!note) return res.status(404).json({ error: "Note not found" });

    if (note.user_id === user_id) {
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

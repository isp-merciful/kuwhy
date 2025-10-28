// backend/party_chat_api.js
const express = require("express");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const router = express.Router();

/** เช็กสิทธิ์: ต้องเป็นเจ้าของ note หรือสมาชิกปาร์ตี้ของ note */
async function isPartyMemberOrOwner(noteId, userId) {
  const note = await prisma.note.findUnique({
    where: { note_id: Number(noteId) },
    select: { user_id: true, max_party: true },
  });
  if (!note) return false;
  if (!note.max_party || note.max_party <= 0) return false; // ไม่ใช่ปาร์ตี้
  if (note.user_id === userId) return true;

  const member = await prisma.party_members.findFirst({
    where: { note_id: Number(noteId), user_id: userId },
    select: { id: true },
  });
  return !!member;
}




/** GET /api/chat/party/:noteId?cursor=0&limit=50
 * ดึงข้อความต่อจาก cursor (message_id) เรียงเก่า→ใหม่
 */
router.get("/party/:noteId", async (req, res) => {
  try {
    const noteId = Number(req.params.noteId);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const cursor = Number(req.query.cursor || 0); // ดึงใหม่กว่า cursor

    const rows = await prisma.party_messages.findMany({
      where: {
        note_id: noteId,
        ...(cursor > 0 ? { message_id: { gt: cursor } } : {}),
      },
      orderBy: { message_id: "asc" },
      take: limit,
      include: {
        // ⛳ ใช้ 'user' (สัมพันธ์ไปโมเดล users)
        user: { select: { user_id: true, user_name: true, img: true } },
      },
    });

    const messages = rows.map((m) => ({
      message_id: m.message_id,
      user_id: m.user_id,
      user_name: m.user?.user_name ?? "anonymous",
      img: m.user?.img ?? null,
      content: m.content,
      created_at: m.created_at,
    }));

    res.json({ messages });
  } catch (err) {
    console.error("❌ GET party chat error:", err);
    res.status(500).json({ error: "fetch party messages failed" });
  }
});

/** POST /api/chat/party/:noteId
 * body: { user_id, content }
 */
router.post("/party/:noteId", async (req, res) => {
  try {
    const noteId = Number(req.params.noteId);
    const { user_id, content } = req.body;

    if (!user_id || !String(content || "").trim()) {
      return res.status(400).json({ error: "user_id และ content จำเป็น" });
    }

    // ต้องเป็นเจ้าของหรือสมาชิกปาร์ตี้เท่านั้น
    const allowed = await isPartyMemberOrOwner(noteId, user_id);
    if (!allowed) {
      return res.status(403).json({ error: "not a party member" });
    }

    const msg = await prisma.party_messages.create({
      data: {
        note_id: noteId,
        user_id,
        content: String(content).trim(),
      },
      include: {
        user: { select: { user_name: true, img: true } },
      },
    });

    res.status(201).json({
      message: "sent",
      value: {
        message_id: msg.message_id,
        user_id: msg.user_id,
        user_name: msg.user?.user_name ?? "anonymous",
        img: msg.user?.img ?? null,
        content: msg.content,
        created_at: msg.created_at,
      },
    });
  } catch (err) {
    console.error("❌ POST party chat error:", err);
    res.status(500).json({ error: "send message failed" });
  }
});

/** (option) ลบข้อความตัวเอง */
router.delete("/party/:noteId/:messageId", async (req, res) => {
  try {
    const messageId = Number(req.params.messageId);
    const { user_id } = req.body;

    const m = await prisma.party_messages.findUnique({
      where: { message_id: messageId },
      select: { user_id: true },
    });
    if (!m) return res.status(404).json({ error: "message not found" });
    if (m.user_id !== user_id) {
      return res.status(403).json({ error: "can delete own message only" });
    }

    await prisma.party_messages.delete({ where: { message_id: messageId } });
    res.json({ message: "deleted" });
  } catch (err) {
    console.error("❌ DELETE party chat error:", err);
    res.status(500).json({ error: "delete message failed" });
  }
});

module.exports = router;

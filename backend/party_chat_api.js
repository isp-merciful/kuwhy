const express = require("express");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { ensureNotPunished } = require("./punish_mw");

const router = express.Router();

async function isPartyMemberOrOwner(noteId, userId) {
  const note = await prisma.note.findUnique({
    where: { note_id: Number(noteId) },
    select: { user_id: true, max_party: true },
  });
  if (!note) return false;
  if (!note.max_party || note.max_party <= 0) return false; 

  if (note.user_id === userId) return true;

  const member = await prisma.party_members.findFirst({
    where: { note_id: Number(noteId), user_id: userId },
    select: { id: true },
  });
  return !!member;
}

router.get("/party/:noteId", async (req, res) => {
  try {
    const noteId = Number(req.params.noteId);
    if (!Number.isFinite(noteId))
      return res.status(400).json({ error: "invalid note_id" });

    const userId = String(req.user?.id || ""); 
    const allowed = await isPartyMemberOrOwner(noteId, userId);
    if (!allowed) return res.status(403).json({ error: "not a party member" });

    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const cursor = Number(req.query.cursor || 0); 

    const rows = await prisma.party_messages.findMany({
      where: {
        note_id: noteId,
        ...(cursor > 0 ? { message_id: { gt: cursor } } : {}),
      },
      orderBy: { message_id: "asc" },
      take: limit,
      include: {
        user: {
          select: {
            user_id: true,
            user_name: true,
            img: true,
            login_name: true, 
          },
        }, 
      },
    });

    const messages = rows.map((m) => ({
      message_id: m.message_id,
      user_id: m.user_id,
      user_name: m.user?.user_name ?? "anonymous",
      img: m.user?.img ?? null,
      content: m.content,
      created_at: m.created_at,
      login_name: m.user?.login_name ?? null,
    }));

    res.json({ messages });
  } catch (err) {
    console.error("❌ GET party chat error:", err);
    res.status(500).json({ error: "fetch party messages failed" });
  }
});


router.post("/party/:noteId",ensureNotPunished, async (req, res) => {
  try {
    const noteId = Number(req.params.noteId);
    if (!Number.isFinite(noteId))
      return res.status(400).json({ error: "invalid note_id" });

    const user_id = String(req.user?.id || ""); 
    const content = String(req.body?.content || "").trim();
    if (!content)
      return res.status(400).json({ error: "content is required" });

    const allowed = await isPartyMemberOrOwner(noteId, user_id);
    if (!allowed) return res.status(403).json({ error: "not a party member" });

    const msg = await prisma.party_messages.create({
      data: { note_id: noteId, user_id, content },
      include: {
        user: {
          select: {
            user_name: true,
            img: true,
            login_name: true,    
          },
        },
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
        login_name: msg.user?.login_name ?? null, 
      },
    });
  } catch (err) {
    console.error("❌ POST party chat error:", err);
    res.status(500).json({ error: "send message failed" });
  }
});


router.delete("/party/:noteId/:messageId", async (req, res) => {
  try {
    const noteId = Number(req.params.noteId);
    const messageId = Number(req.params.messageId);
    if (!Number.isFinite(noteId) || !Number.isFinite(messageId)) {
      return res.status(400).json({ error: "invalid params" });
    }

    const user_id = String(req.user?.id || "");
    const allowed = await isPartyMemberOrOwner(noteId, user_id);
    if (!allowed) return res.status(403).json({ error: "not a party member" });

    const m = await prisma.party_messages.findUnique({
      where: { message_id: messageId },
      select: { user_id: true, note_id: true },
    });
    if (!m) return res.status(404).json({ error: "message not found" });
    if (m.note_id !== noteId)
      return res.status(400).json({ error: "note mismatch" });
    if (m.user_id !== user_id)
      return res
        .status(403)
        .json({ error: "can delete own message only" });

    await prisma.party_messages.delete({ where: { message_id: messageId } });
    res.json({ message: "deleted" });
  } catch (err) {
    console.error("❌ DELETE party chat error:", err);
    res.status(500).json({ error: "delete message failed" });
  }
});

module.exports = router;

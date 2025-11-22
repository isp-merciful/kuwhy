const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { optionalAuth, requireMember,requireAuth } = require("./auth_mw");
const { ensureNotPunished } = require("./punish_mw");

const prisma = new PrismaClient();
const router = express.Router();

function resolveActor(req) {
  if (req.user?.id) return { id: String(req.user.id), mode: "auth" };
  const bodyId = String(req.body?.user_id || "").trim();
  if (!bodyId) return null; // ไม่รู้ว่าใครเลย
  return { id: bodyId, mode: "anon" };
}

async function ensureUserExists(user_id, isAnon = false) {
  await prisma.users.upsert({
    where: { user_id },
    update: {}, 
    create: {
      user_id,
      user_name: isAnon ? "anonymous" : "Anonymous", 
      role: isAnon ? "anonymous" : "member",         
      img: "/images/pfp.png",
      gender: "Not_Specified",
      email: null,
    },
  });
}

async function getActivePartyForUser(userId, excludeNoteId) {
  const hosting = await prisma.note.findFirst({
    where: {
      user_id: String(userId),
      max_party: { gt: 0 },
      ...(excludeNoteId ? { NOT: { note_id: Number(excludeNoteId) } } : {}),
    },
    select: { note_id: true, message: true, max_party: true },
  });
  if (hosting) return { role: "host", note_id: hosting.note_id };

  const membership = await prisma.party_members.findFirst({
    where: {
      user_id: String(userId),
      ...(excludeNoteId ? { NOT: { note_id: Number(excludeNoteId) } } : {}),
    },
    select: { note_id: true },
  });
  if (membership) {
    const n = await prisma.note.findUnique({
      where: { note_id: membership.note_id },
      select: { max_party: true },
    });
    if (n && n.max_party > 0) {
      return { role: "member", note_id: membership.note_id };
    }
  }
  return null;
}

router.get("/", async (_req, res) => {
  try {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 1 วันก่อน

    await prisma.note.deleteMany({
      where: {
        created_at: {
          lt: oneDayAgo,  
        },
      },
    });

    const notes = await prisma.note.findMany({
      where: {
        created_at: {
          gte: oneDayAgo, 
        },
      },
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


router.get("/user/:id", async (req, res) => {
  const userId = req.params.id;
  try {
    const ownNote = await prisma.note.findFirst({
      where: { user_id: userId },
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


router.post("/", optionalAuth,ensureNotPunished, async (req, res) => {
  try {
    const { message } = req.body;
    let { max_party } = req.body;
   const hasBearer = typeof req.headers.authorization === "string" &&
                     req.headers.authorization.startsWith("Bearer ");
   if (hasBearer && !req.user) {
     return res.status(401).json({ error: "Invalid or expired token" });
   }

    if (!message || String(message).trim() === "") {
      return res.status(400).json({ error: "ไม่มี notes" });
    }

    max_party = Number(max_party) || 0;
    if (max_party > 0) {
      max_party = Math.min(20, Math.max(2, Math.floor(max_party)));
    } else {
      max_party = 0;
    }

    const actor = resolveActor(req);
    if (!actor) return res.status(401).json({ error: "Missing user identity" });

    if (max_party > 0 && actor.mode === "anon") {
      return res.status(401).json({ error: "Party note requires login" });
    }

    await ensureUserExists(actor.id, actor.mode === "anon");

    const crr_party = max_party > 0 ? 1 : 0;

    const newNote = await prisma.note.create({
      data: {
        message: String(message),
        max_party,
        crr_party,
        user_id: actor.id,     
      },
    });

    res.status(201).json({
      message: "add note success",
      note_id: newNote.note_id,
      note: newNote,
      value: newNote, 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "add notes fail" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const noteId = Number(req.params.id);

    const note = await prisma.note.findUnique({
      where: { note_id: noteId },
      select: { note_id: true, user_id: true },
    });
    if (!note) return res.status(404).json({ error: "Note not found" });

    await prisma.note.delete({ where: { note_id: noteId } });
    res.json("delete success");
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "can't delete" });
  }
});


router.post("/join", requireAuth,ensureNotPunished, async (req, res) => {
  try {
    const userId = String(req.user.id);
    const noteId = Number(req.body.note_id);

    if (!Number.isFinite(noteId) || noteId <= 0) {
      return res.status(400).json({ ok: false, error: "Invalid note_id" });
    }

    const note = await prisma.note.findUnique({
      where: { note_id: noteId },
      select: { note_id: true, user_id: true, max_party: true, crr_party: true },
    });
    if (!note) return res.status(404).json({ ok: false, error: "Note not found" });
    if (note.max_party <= 0) {
      return res
        .status(400)
        .json({ ok: false, error: "This note is not a party" });
    }

    if (String(note.user_id) === userId) {
      return res.json({
        ok: true,
        data: { crr_party: note.crr_party, max_party: note.max_party },
        info: "already host",
      });
    }

    const alreadyHere = await prisma.party_members.findUnique({
      where: { note_id_user_id: { note_id: noteId, user_id: userId } },
      select: { note_id: true },
    });
    if (alreadyHere) {
      return res.json({
        ok: true,
        data: { crr_party: note.crr_party, max_party: note.max_party },
        info: "already joined",
      });
    }

    const inAnother = await getActivePartyForUser(userId, noteId);
    if (inAnother) {
      return res.status(409).json({
        ok: false,
        error: "You are already in another party. Leave it first.",
        error_code: "ALREADY_IN_PARTY",
        current_note_id: inAnother.note_id,
        as: inAnother.role,
      });
    }

    if (note.crr_party >= note.max_party) {
      return res.status(409).json({
        ok: false,
        error: "Party is full",
        error_code: "PARTY_FULL",
      });
    }

    await prisma.party_members.create({
      data: { note_id: noteId, user_id: userId },
    });

    const updated = await prisma.note.update({
      where: { note_id: noteId },
      data: { crr_party: { increment: 1 } },
      select: { crr_party: true, max_party: true },
    });

    try {
      if (note.user_id && note.user_id !== userId) {
        await prisma.notifications.create({
          data: {
            recipient_id: note.user_id,
            sender_id: userId,          
            note_id: noteId,
            type: "party_join",
            is_read: false,
          },
        });
      }
    } catch (errNoti) {
      console.error("[POST /note/join] create notification failed:", errNoti);
    }

    return res.json({ ok: true, data: updated });
  } catch (err) {
    console.error("[POST /note/join] error:", err);
    return res.status(500).json({ ok: false, error: "Join failed" });
  }
});

router.post("/leave", requireMember, async (req, res) => {
  try {
    const note_id = Number(req.body.note_id);
    const user_id = String(req.user.id); 

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


router.get("/party/is-member", requireMember, async (req, res) => {
  try {
    const note_id = Number(req.query.note_id);
    const user_id = String(req.user.id); 
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

router.get("/:id/members", async (req, res) => {
  try {
    const noteId = Number(req.params.id);
    if (!Number.isFinite(noteId) || noteId <= 0) {
      return res.status(400).json({ ok: false, error: "Invalid note_id" });
    }

    const note = await prisma.note.findUnique({
      where: { note_id: noteId },
      select: { note_id: true, user_id: true, max_party: true },
    });
    if (!note) return res.status(404).json({ ok: false, error: "Note not found" });

    const host = await prisma.users.findUnique({
      where: { user_id: note.user_id },
      select: { user_id: true, user_name: true, img: true },
    });

    let members = [];
    if (note.max_party > 0) {
      const rows = await prisma.party_members.findMany({
        where: { note_id: noteId },
        select: { user_id: true },
        orderBy: { id: "asc" },
      });

      const ids = rows.map(r => r.user_id).filter(Boolean);
      const users = ids.length
        ? await prisma.users.findMany({
            where: { user_id: { in: ids } },
            select: { user_id: true, user_name: true, img: true },
          })
        : [];

      const byId = new Map(users.map(u => [u.user_id, u]));
      members = ids
        .filter(uid => uid !== note.user_id) 
        .map(uid => byId.get(uid) || { user_id: uid, user_name: "anonymous", img: null });
    }


    const crr_party = note.max_party > 0 ? 1 + members.length : 0;

    return res.json({
      ok: true,
      note_id: note.note_id,
      max_party: note.max_party,
      crr_party,
      host: host || { user_id: note.user_id, user_name: "anonymous", img: null },
      members,
    });
  } catch (err) {
    console.error("[GET /note/:id/members] error:", err);
    return res.status(500).json({ ok: false, error: "failed to fetch members" });
  }
});

module.exports = router;
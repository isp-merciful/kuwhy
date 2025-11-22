const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const { requireMember, requireAdmin } = require("./auth_mw");
const { ensureNotPunished } = require("./punish_mw");

const ALLOWED_TARGET_TYPES = ["note", "comment", "blog", "party_chat"];


function normalizeTargetType(t) {
  if (!t) return "";
  const v = String(t).toLowerCase();
  if (ALLOWED_TARGET_TYPES.includes(v)) return v;
  return "";
}

function toInt(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}

router.post("/", requireMember, ensureNotPunished, async (req, res) => {
  try {
    const { targetType, targetId, reason, detail } = req.body || {};
    const reporterId = req.user && req.user.id;

  if (!reporterId) {
    return res.status(401).json({
      error: "Please log in before reporting content.",
      error_code: "LOGIN_REQUIRED_FOR_REPORT",
    });
  }

    const tType = normalizeTargetType(targetType);
    if (!tType) {
      return res.status(400).json({ error: "Invalid targetType" });
    }

    if (!targetId) {
      return res.status(400).json({ error: "Missing targetId" });
    }

    const idNum = toInt(targetId);
    if (Number.isNaN(idNum)) {
      return res.status(400).json({ error: "targetId must be a number" });
    }

    const data = {
      reporter_id: reporterId,
      target_type: tType,
      reason: reason ? String(reason).slice(0, 255) : null,
      detail: detail ? String(detail) : null,
      status: "pending",
    };

    let targetUserId = null;

    if (tType === "note") {
      const note = await prisma.note.findUnique({
        where: { note_id: idNum },
        select: { user_id: true },
      });
      if (!note) {
        return res.status(404).json({ error: "Note not found" });
      }
      targetUserId = note.user_id;
      data.note_id = idNum;
    } else if (tType === "comment") {
      const c = await prisma.comment.findUnique({
        where: { comment_id: idNum },
        select: { user_id: true, blog_id: true, note_id: true },
      });
      if (!c) {
        return res.status(404).json({ error: "Comment not found" });
      }
      targetUserId = c.user_id;
      data.comment_id = idNum;
      if (c.blog_id) data.blog_id = c.blog_id;
      if (c.note_id) data.note_id = c.note_id;
    } else if (tType === "blog") {
      const b = await prisma.blog.findUnique({
        where: { blog_id: idNum },
        select: { user_id: true },
      });
      if (!b) {
        return res.status(404).json({ error: "Blog not found" });
      }
      targetUserId = b.user_id;
      data.blog_id = idNum;
    } else if (tType === "party_chat") {
      const msg = await prisma.party_messages.findUnique({
        where: { message_id: idNum },
        select: { user_id: true, note_id: true, content: true },
      });
      if (!msg) {
        return res.status(404).json({ error: "Chat message not found" });
      }
      targetUserId = msg.user_id;
      data.note_id = msg.note_id;
      if (!data.detail) {
        data.detail = `Reported party chat message: "${msg.content}"`;
      }
    }

    data.target_user_id = targetUserId;

    const created = await prisma.user_report.create({ data });
    return res.status(201).json({ ok: true, report: created });
  } catch (err) {
    console.error("[POST /api/report] error:", err);
    return res.status(500).json({ error: "Create report failed" });
  }
});

router.get("/", requireAdmin, async (req, res) => {
  try {
    const status = (req.query.status || "pending").toString();

    let where = {};
    if (status === "pending") {
      where = { status: "pending" };
    } else if (status === "resolved") {
      where = { status: "resolved" };
    } 

    const reports = await prisma.user_report.findMany({
      where,
      orderBy: { id: "desc" },
      include: {
        reporter: {
          select: { user_id: true, login_name: true },
        },
        targetUser: {
          select: { user_id: true, login_name: true },
        },
      },
    });

    const payload = reports.map((r) => ({
      id: r.id,
      reporter_id: r.reporter_id,
      reporter_login: r.reporter?.login_name || null,
      target_user_id: r.target_user_id,
      target_login: r.targetUser?.login_name || null,
      target_type: r.target_type,
      note_id: r.note_id,
      comment_id: r.comment_id,
      blog_id: r.blog_id,
      reason: r.reason,
      detail: r.detail,
      status: r.status,
      resolution_action: r.resolution_action,
      created_at: r.created_at,
      resolved_at: r.resolved_at,
      resolved_by: r.resolved_by,
    }));

    return res.json({ ok: true, reports: payload });
  } catch (err) {
    console.error("[GET /api/report] error:", err);
    return res.status(500).json({ error: "Failed to load reports" });
  }
});

router.patch("/:id/resolve", requireAdmin, async (req, res) => {
  try {
    const idNum = toInt(req.params.id);
    if (Number.isNaN(idNum)) {
      return res.status(400).json({ error: "Invalid report id" });
    }

    const { status, resolution_action } = req.body || {};
    const data = {
      status: status || "resolved",
      resolved_at: new Date(),
      resolved_by: req.user ? req.user.id : null,
    };
    if (resolution_action) {
      data.resolution_action = String(resolution_action);
    }

    const updated = await prisma.user_report.update({
      where: { id: idNum },
      data,
    });

    return res.json({ ok: true, report: updated });
  } catch (err) {
    console.error("[PATCH /api/report/:id/resolve] error:", err);
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Report not found" });
    }
    return res.status(500).json({ error: "Failed to update report" });
  }
});

module.exports = router;

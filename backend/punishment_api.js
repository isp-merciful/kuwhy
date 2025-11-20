// backend/punishment_api.js
const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const { requireAdmin, requireMember } = require("./auth_mw");

const KIND_TO_TYPE = {
  timeout: "TIMEOUT",
  ban_user: "BAN_USER",
  ban_ip: "BAN_IP",
};

const TYPE_TO_KIND = {
  TIMEOUT: "timeout",
  BAN_USER: "ban_user",
  BAN_IP: "ban_ip",
};

const ACTIVE_TYPES = ["TIMEOUT", "BAN_USER", "BAN_IP"];

function toInt(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}

/* ---------- POST /api/punish ---------- */
// body: { user_id?, ip_address?, kind, minutes?, reason?, report_id? }
router.post("/", requireAdmin, async (req, res) => {
  try {
    const {
      user_id,
      ip_address,
      kind,
      minutes,
      reason,
      report_id,
    } = req.body || {};

    if (!kind || !KIND_TO_TYPE[kind]) {
      return res.status(400).json({ error: "Invalid kind" });
    }

    const type = KIND_TO_TYPE[kind];

    if ((type === "TIMEOUT" || type === "BAN_USER") && !user_id) {
      return res
        .status(400)
        .json({ error: "user_id is required for this punishment" });
    }

    if (type === "BAN_IP" && !ip_address) {
      return res
        .status(400)
        .json({ error: "ip_address is required for BAN_IP" });
    }

    let expires_at = null;
    if (type === "TIMEOUT") {
      const m = Number(minutes) || 60; // default 60 นาที
      expires_at = new Date(Date.now() + m * 60 * 1000);
    }

    const finalReason =
      reason ||
      (report_id ? `Auto punishment from report #${report_id}` : null);

    const data = {
      user_id: user_id || null,
      ip_address: ip_address || null,
      type,
      reason: finalReason ? String(finalReason).slice(0, 255) : null,
      expires_at,
      created_by: req.user ? req.user.id : null,
    };

    const created = await prisma.user_punishment.create({ data });

    return res.status(201).json({
      ok: true,
      punishment: created,
      kind,
    });
  } catch (err) {
    console.error("[POST /api/punish] error:", err);
    return res.status(500).json({ error: "Create punishment failed" });
  }
});

/* ---------- GET /api/punish ---------- */
// ?includeExpired=1 เพื่อโชว์หมด
router.get("/", requireAdmin, async (req, res) => {
  try {
    const includeExpired =
      req.query.includeExpired === "1" || req.query.includeExpired === "true";

    const now = new Date();
    const where = includeExpired
      ? {}
      : {
          revoked_at: null,
          OR: [{ expires_at: null }, { expires_at: { gt: now } }],
        };

    const punishments = await prisma.user_punishment.findMany({
      where,
      orderBy: { id: "desc" },
    });

    const userIds = [
      ...new Set(
        punishments.map((p) => p.user_id).filter((id) => typeof id === "string")
      ),
    ];

    let userMap = {};
    if (userIds.length > 0) {
      const users = await prisma.users.findMany({
        where: { user_id: { in: userIds } },
        select: { user_id: true, login_name: true },
      });
      userMap = Object.fromEntries(
        users.map((u) => [u.user_id, u.login_name || null])
      );
    }

    const items = punishments.map((p) => ({
      ...p,
      kind: TYPE_TO_KIND[p.type] || p.type,
      login_name: p.user_id ? userMap[p.user_id] || null : null,
      until: p.expires_at,
    }));

    return res.json({ ok: true, items });
  } catch (err) {
    console.error("[GET /api/punish] error:", err);
    return res.status(500).json({ error: "Failed to load punishments" });
  }
});

/* ---------- PATCH /api/punish/:id/unban ---------- */
router.patch("/:id/unban", requireAdmin, async (req, res) => {
  try {
    const idNum = toInt(req.params.id);
    if (Number.isNaN(idNum)) {
      return res.status(400).json({ error: "Invalid punishment id" });
    }

    const now = new Date();

    const updated = await prisma.user_punishment.update({
      where: { id: idNum },
      data: {
        revoked_at: now,
        expires_at: now,
        revoked_by: req.user ? req.user.id : null,
      },
    });

    return res.json({ ok: true, punishment: updated });
  } catch (err) {
    console.error("[PATCH /api/punish/:id/unban] error:", err);
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Punishment not found" });
    }
    return res.status(500).json({ error: "Failed to unban" });
  }
});

router.get("/me", requireMember, async (req, res) => {
  try {
    const userId = req.user && req.user.id ? String(req.user.id) : null;

    // พยายามดึง IP ให้ได้มากที่สุด
    const ip =
      (req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
      req.ip ||
      (req.connection && req.connection.remoteAddress) ||
      null;

    if (!userId && !ip) {
      return res.json({ active: false, punishments: [] });
    }

    const where = { revoked_at: null };
    const or = [];
    if (userId) or.push({ user_id: userId });
    if (ip) or.push({ ip_address: ip });
    if (or.length > 0) where.OR = or;

    const rows = await prisma.user_punishment.findMany({
      where,
      orderBy: { created_at: "desc" },
    });

    const now = new Date();

    const active = rows.filter((p) => {
      const t = String(p.type || "").toUpperCase();
      if (!ACTIVE_TYPES.includes(t)) return false;
      if (p.expires_at && p.expires_at <= now) return false;
      return true;
    });

    const result = active.map((p) => ({
      id: p.id,
      type: p.type,
      reason: p.reason,
      created_at: p.created_at,
      expires_at: p.expires_at,
    }));

    return res.json({
      active: result.length > 0,
      punishments: result,
    });
  } catch (err) {
    console.error("[GET /api/punish/me] error:", err);
    return res.status(500).json({ error: "Failed to check punishment" });
  }
});

// 👇 เช็กสถานะ punish สำหรับ anonymous ได้ (ไม่ต้อง login)
router.get("/public", async (req, res) => {
  try {
    const userId = req.query.user_id ? String(req.query.user_id) : null;

    const ipHeader = (req.headers["x-forwarded-for"] || "").split(",")[0].trim();
    const ip =
      ipHeader ||
      req.ip ||
      (req.connection && req.connection.remoteAddress) ||
      null;

    if (!userId && !ip) {
      return res.json({ active: false, punishments: [] });
    }

    const where = { revoked_at: null };

    if (userId && ip) {
      where.OR = [{ user_id: userId }, { ip_address: ip }];
    } else if (userId) {
      where.user_id = userId;
    } else if (ip) {
      where.ip_address = ip;
    }

    const punishments = await prisma.user_punishment.findMany({ where });

    const now = new Date();
    const ACTIVE_TYPES = ["TIMEOUT", "BAN_USER", "BAN_IP"];

    const active = punishments.filter((p) => {
      const t = String(p.type || "").toUpperCase();
      if (!ACTIVE_TYPES.includes(t)) return false;
      if (p.expires_at && p.expires_at <= now) return false;
      return true;
    });

    return res.json({
      active: active.length > 0,
      punishments: active.map((p) => ({
        id: p.id,
        type: p.type,
        reason: p.reason,
        expires_at: p.expires_at,
      })),
    });
  } catch (e) {
    console.error("[punish/public] error:", e);
    return res
      .status(500)
      .json({ error: "failed to check punishment", active: false });
  }
});


module.exports = router;

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function ensureNotPunished(req, res, next) {
  try {
    let userId = null;

    if (req.user && req.user.id) {
      userId = String(req.user.id);
    }

    if (!userId && req.body && req.body.user_id) {
      userId = String(req.body.user_id);
    }

    const ipHeader = (req.headers["x-forwarded-for"] || "").split(",")[0].trim();
    const ip =
      ipHeader ||
      req.ip ||
      (req.connection && req.connection.remoteAddress) ||
      null;

    if (!userId && !ip) {
      return next();
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

    const activePunishments = punishments.filter((p) => {
      const t = String(p.type || "").toUpperCase();
      if (!ACTIVE_TYPES.includes(t)) return false;
      if (p.expires_at && p.expires_at <= now) return false;
      return true;
    });

    if (activePunishments.length === 0) {
      return next();
    }

    const hasBan = activePunishments.some((p) => {
      const t = String(p.type || "").toUpperCase();
      return t === "BAN_USER" || t === "BAN_IP";
    });

    const message = hasBan
      ? "You are banned from performing this action."
      : "You are temporarily restricted from performing this action.";

    return res.status(403).json({ error: message, code: "PUNISHED" });
  } catch (e) {
    console.error("[ensureNotPunished] error:", e);
    return next();
  }
}

module.exports = { ensureNotPunished };

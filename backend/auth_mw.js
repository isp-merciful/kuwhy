// backend/auth_mw.js
const { jwtVerify } = require("jose");

// ===== Secret (ต้องตั้ง NEXTAUTH_SECRET ให้ตรงกับ NextAuth) =====
if (!process.env.NEXTAUTH_SECRET) {
  // ไม่ throw เพื่อไม่ล่มตอน dev แต่จะ 401 ทุกเคส verify
  // แนะนำ: ตั้งให้ถูกก่อนรันจริง
  console.warn("[auth_mw] Missing NEXTAUTH_SECRET env");
}
const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || "unset-secret");

// ===== helpers =====
function getBearerToken(req) {
  const h = req.headers.authorization || "";
  return h.startsWith("Bearer ") ? h.slice(7) : "";
}

async function verifyToken(token) {
  const { payload } = await jwtVerify(token, secret);
  // ตามที่เราอัดจาก NextAuth: { id, role, login_name, name, picture, ... }
  return payload;
}

// ===== middlewares =====

/** แนบ req.user แบบ "ถ้ามี token" เท่านั้น (ไม่บังคับ) */
async function optionalAuth(req, _res, next) {
  try {
    const token = getBearerToken(req);
    if (token) {
      req.user = await verifyToken(token);
      req.token = token;
    }
  } catch {
    // ถ้ามี token แต่ verify ไม่ผ่าน → ถือว่าไม่มี user แล้วไปต่อแบบ anonymous
    req.user = undefined;
    req.token = undefined;
  }
  return next();
}

/** ต้องมี token และ verify ผ่านเท่านั้น */
async function requireAuth(req, res, next) {
  try {
    const token = getBearerToken(req);
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    req.user = await verifyToken(token);
    req.token = token;
    return next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
}

/** ต้องมีบทบาทตามที่กำหนด (ใช้ได้หลายกรณี) */
function requireRoles(roles = []) {
  return async (req, res, next) => {
    return requireAuth(req, res, () => {
      const r = req.user?.role;
      if (roles.length === 0 || roles.includes(r)) return next();
      return res.status(403).json({ error: "Forbidden" });
    });
  };
}

/** member หรือ admin */
const requireMember = requireRoles(["member", "admin"]);

/** admin เท่านั้น */
const requireAdmin = requireRoles(["admin"]);

/** เจ้าของ param (เช่น /api/user/:userId) เท่านั้น */
function requireOwnerParam(paramName = "userId") {
  return async (req, res, next) => {
    return requireAuth(req, res, () => {
      if (req.user?.id === String(req.params[paramName])) return next();
      return res.status(403).json({ error: "Forbidden: owner only" });
    });
  };
}

/** เจ้าตัวเอง หรือ admin */
function requireSelfOrAdmin(paramName = "userId") {
  return async (req, res, next) => {
    return requireAuth(req, res, () => {
      const isOwner = req.user?.id === String(req.params[paramName]);
      const isAdmin = req.user?.role === "admin";
      if (isOwner || isAdmin) return next();
      return res.status(403).json({ error: "Forbidden" });
    });
  };
}

module.exports = {
  // core
  optionalAuth,
  requireAuth,
  requireMember,
  requireAdmin,
  // generic/extra
  requireRoles,
  requireOwnerParam,
  requireSelfOrAdmin,
};

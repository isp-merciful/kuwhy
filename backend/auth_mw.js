// backend/auth_mw.js
const { jwtVerify } = require("jose");

// ===== Secret (ต้องตั้ง NEXTAUTH_SECRET ให้ตรงกับ NextAuth) =====
if (!process.env.NEXTAUTH_SECRET) {
  console.warn("[auth_mw] Missing NEXTAUTH_SECRET env");
}
const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || "unset-secret");

// ===== helpers =====
function getBearerToken(req) {
  const h = req.headers.authorization || "";
  return h.startsWith("Bearer ") ? h.slice(7) : "";
}

function getNextAuthCookieToken(req) {
  // NextAuth ใช้ชื่อคุกกี้ต่างกันระหว่าง dev/prod
  // - prod (https): __Secure-next-auth.session-token
  // - dev:          next-auth.session-token
  const cookies = req.cookies || {};
  return (
    cookies["__Secure-next-auth.session-token"] ||
    cookies["next-auth.session-token"] ||
    ""
  );
}

async function verifyToken(token) {
  // เผื่อ clock skew เล็กน้อย
  const { payload } = await jwtVerify(token, secret, { clockTolerance: 60 });
  // token จาก NextAuth callbacks เราอัด { id, role, login_name, ... }
  return payload;
}

async function getTokenFromReq(req) {
  // 1) พยายามอ่านจาก Authorization: Bearer <token>
  let token = getBearerToken(req);
  // 2) ถ้าไม่มี Bearer ให้ fallback ไปหาคุกกี้ NextAuth
  if (!token) token = getNextAuthCookieToken(req);
  return token || "";
}

// ===== middlewares =====

/** แนบ req.user แบบ "ถ้ามี token" เท่านั้น (ไม่บังคับ) */
async function optionalAuth(req, _res, next) {
  try {
    const token = await getTokenFromReq(req);
    if (token) {
      req.user = await verifyToken(token);
      req.token = token;
    } else {
      req.user = undefined;
      req.token = undefined;
    }
  } catch {
    // มี token แต่ verify ไม่ผ่าน → ถือว่า anonymous
    req.user = undefined;
    req.token = undefined;
  }
  return next();
}

/** ต้องมี token และ verify ผ่านเท่านั้น */
async function requireAuth(req, res, next) {
  try {
    const token = await getTokenFromReq(req);
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    req.user = await verifyToken(token);
    req.token = token;
    return next();
  } catch (e) {
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

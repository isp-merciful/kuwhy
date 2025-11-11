// backend/auth_mw.js
const { jwtVerify, jwtDecrypt } = require("jose");

// ✅ ใช้ secret แบบ trim แล้วเสมอ
const RAW = (process.env.NEXTAUTH_SECRET || "").trim();
if (!RAW) console.warn("[auth_mw] Missing NEXTAUTH_SECRET");
const SECRET_KEY = new TextEncoder().encode(RAW);

function getBearerToken(req) {
  const h = req.headers.authorization || "";
  return h.startsWith("Bearer ") ? h.slice(7).trim() : "";
}

async function decodeAny(token) {
  const parts = token.split(".");
  const opts = { clockTolerance: 60 }; // กัน clock เพี้ยน

  if (parts.length === 5) {
    // JWE
    const { payload } = await jwtDecrypt(token, SECRET_KEY, opts);
    return payload;
  } else if (parts.length === 3) {
    // JWS (เช่น ที่ encode ด้วย next-auth/jwt)
    const { payload } = await jwtVerify(token, SECRET_KEY, {
      algorithms: ["HS256", "HS512"], // ครอบคลุม
      clockTolerance: 60,
    });
    return payload;
  }
  throw new Error("Invalid JWT compact format");
}

async function optionalAuth(req, _res, next) {
  const token = getBearerToken(req);
  if (!token) return next();
  try {
    const payload = await decodeAny(token);
    req.user = payload;
  } catch (e) {
    // ไม่บล็อก แต่ไม่ตั้ง req.user
    // console.warn("[optionalAuth] invalid token:", e);
  }
  next();
}

async function requireAuth(req, res, next) {
  const token = getBearerToken(req);
  if (!token) return res.status(401).json({ error: "Missing bearer token" });
  try {
    const payload = await decodeAny(token);
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid/expired token" });
  }
}

function requireMember(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  if (req.user.role === "member" || req.user.role === "admin") return next();
  return res.status(403).json({ error: "Forbidden" });
}
function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  if (req.user.role === "admin") return next();
  return res.status(403).json({ error: "Forbidden" });
}

module.exports = { optionalAuth, requireAuth, requireMember, requireAdmin };

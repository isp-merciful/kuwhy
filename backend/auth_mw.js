const { jwtVerify /*, jwtDecrypt*/ } = require("jose");

const RAW = (process.env.NEXTAUTH_SECRET || "").trim();
if (!RAW) console.warn("[auth_mw] Missing NEXTAUTH_SECRET (ทุกเคสจะ 401)");
const SECRET = new TextEncoder().encode(RAW);
function getBearerToken(req) {
  const h = req.headers.authorization || req.headers.Authorization || "";
  return typeof h === "string" && h.startsWith("Bearer ") ? h.slice(7).trim() : "";
}

async function verifyFromHeader(req) {
  const token = getBearerToken(req);
  if (!token) throw new Error("no token");

  const { payload, protectedHeader } = await jwtVerify(token, SECRET, {
    algorithms: ["HS256"],
    clockTolerance: 60, 
  });

  if (!payload?.id) throw new Error("no id in token");
  req.tokenHeader = protectedHeader;
  return payload; 
}

async function optionalAuth(req, _res, next) {
  try {
    req.user = await verifyFromHeader(req);
  } catch (_) {
  }
  return next();
}

async function requireAuth(req, res, next) {
  try {
    req.user = await verifyFromHeader(req);
    return next();
  } catch (e) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[requireAuth] verify failed:", e?.message || e);
    }
    return res.status(401).json({
      error: "Please log in to continue.",
      error_code: "LOGIN_REQUIRED",
    });
  }
}

async function requireMember(req, res, next) {
  try {
    req.user = await verifyFromHeader(req);
  } catch (e) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[requireMember] verify failed:", e?.message || e);
    }
        return res.status(401).json({
      error: "Please log in to continue.",
      error_code: "LOGIN_REQUIRED",
    });
  }
  const role = String(req.user?.role || "");
  if (!["member", "admin"].includes(role)) {
    return res.status(403).json({ error: "Forbidden (member only)" }); 
  }
  return next();
}

async function requireAdmin(req, res, next) {
  try {
    req.user = await verifyFromHeader(req);
  } catch (e) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[requireAdmin] verify failed:", e?.message || e);
    }
    return res.status(401).json({
      error: "Please log in to admin account continue.",
      error_code: "LOGIN_REQUIRED",
    });
  }
  const role = String(req.user?.role || "");
  if (role !== "admin") {
    return res.status(403).json({ error: "Forbidden (admin only)" });
  }
  return next();
}

module.exports = { optionalAuth, requireAuth, requireMember, requireAdmin };

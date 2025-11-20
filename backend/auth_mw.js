// backend/auth_mw.js
const { jwtVerify /*, jwtDecrypt*/ } = require("jose");

// === Secret (ต้องตรงกับ NextAuth เป๊ะ และ trim แล้ว) ===
const RAW = (process.env.NEXTAUTH_SECRET || "").trim();
if (!RAW) console.warn("[auth_mw] Missing NEXTAUTH_SECRET (ทุกเคสจะ 401)");
const SECRET = new TextEncoder().encode(RAW);

// === helpers ===
function getBearerToken(req) {
  const h = req.headers.authorization || req.headers.Authorization || "";
  return typeof h === "string" && h.startsWith("Bearer ") ? h.slice(7).trim() : "";
}

// ถ้าคุณยังไม่ได้ออก JWE จริง ๆ แนะนำ “ล็อก HS256 JWS เท่านั้น”
async function verifyFromHeader(req) {
  const token = getBearerToken(req);
  if (!token) throw new Error("no token");

  // --- รองรับ JWS HS256 เท่านั้น (ตรงกับที่ NextAuth ของคุณ sign) ---
  const { payload, protectedHeader } = await jwtVerify(token, SECRET, {
    algorithms: ["HS256"],
    clockTolerance: 60, // กันนาฬิกาเพี้ยน
  });

  // sanity check: ต้องมี id
  if (!payload?.id) throw new Error("no id in token");
  // ใส่ข้อมูลไว้เผื่อดีบัก
  req.tokenHeader = protectedHeader;
  return payload; // { id, role, login_name, iat, exp }
}

// === middlewares ===
async function optionalAuth(req, _res, next) {
  try {
    req.user = await verifyFromHeader(req);
  } catch (_) {
    // ไม่มี token / verify fail ก็ไม่ผูก req.user เฉย ๆ
  }
  return next();
}

async function requireAuth(req, res, next) {
  try {
    req.user = await verifyFromHeader(req);
    return next();
  } catch (e) {
    // เปิด log ตอน dev ให้เห็นชัดว่า fail เพราะอะไร
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
    }); // verify ไม่ผ่าน
  }
  const role = String(req.user?.role || "");
  if (!["member", "admin"].includes(role)) {
    return res.status(403).json({ error: "Forbidden (member only)" }); // role ไม่ถึง
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

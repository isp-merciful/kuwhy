// index.js (or server.js)
const express = require('express');
require('dotenv').config();
const cors = require("cors");
const cookieParser = require('cookie-parser');
const path = require("path");
const fs = require("fs");

const blogRouter = require("./blog_api");
const commentRouter = require("./comment_api");
const noteRouter = require("./note_api");
const userRouter = require("./user_api");
const notificationRouter = require("./notification_api");
const partyChatApi = require("./party_chat_api");
const Forgotpassword = require("./forgot-password");
const reportApi = require("./report_api");
const punishmentApi = require("./punishment_api");
const { requireMember, requireAdmin } = require("./auth_mw");
const settings = require("./user_setting_api");

// jose debug
const { jwtDecrypt, jwtVerify } = require('jose');
const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'unset-secret');
const s = (process.env.NEXTAUTH_SECRET || '').trim();
console.log('[BOOT] SECRET head/tail:', s.slice(0, 4), '...', s.slice(-4), 'len=', s.length);

const app = express();

/* ================== CORE MIDDLEWARE ================== */

// ✅ CORS – ONE config, not duplicated
app.use(
  cors({
    origin:
      (process.env.CORS_ORIGIN && process.env.CORS_ORIGIN.split(",")) ||
      ["http://localhost:3000"],
    methods: ["GET", "POST", "PUT","PATCH", "DELETE"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(cookieParser());

// ✅ Body parsers – higher limit for base64 avatars
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

/* ================== STATIC UPLOADS ================== */

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
app.use("/uploads", express.static(uploadDir));

/* ================== API ROUTES ================== */




// app.options('/:splat*', cors());

app.use(cors({
  origin: "http://localhost:3000",
  methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// === ใช้ session-only สำหรับโปรไฟล์/ตั้งค่า ===
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// === ส่วนอื่นตามสิทธิ์เดิม ===
app.use("/auth",Forgotpassword );
app.use("/api/blog", requireMember, blogRouter);
app.use("/api/noti", notificationRouter);
app.use("/api/comment", commentRouter);
app.use("/api/note", noteRouter);
app.use("/api/user", userRouter);
app.use("/api/chat", requireMember, partyChatApi);
app.use("/api/settings",requireMember,settings)
app.use("/api/report", reportApi);
app.use("/api/punish", punishmentApi);


console.log("[env] SMTP_USER =", process.env.SMTP_USER);
console.log("[env] SMTP_PASS length =", process.env.SMTP_PASS?.length);
console.log("[env] JWT_RESET_SECRET set =", !!process.env.JWT_RESET_SECRET);
// ⬇️ เพิ่ม: นำเข้า jose แล้วประกาศ secret ให้ตรงกันทั้งไฟล์
const { jwtDecrypt, jwtVerify } = require('jose');
const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'unset-secret');
const s = (process.env.NEXTAUTH_SECRET || '').trim();
console.log('[BOOT] SECRET head/tail:', s.slice(0, 4), '...', s.slice(-4), 'len=', s.length);
// profile/settings API (session required)
//app.use("/api/settings", requireMember, settings);

/* ================== DEBUG ROUTES (unchanged) ================== */

// คืน Authorization header ที่ BE ได้รับ
app.get('/api/_debug/headers', (req, res) =>
  res.json({ auth: req.headers.authorization || null })
);

// ดู secret แบบย่อ
app.get('/api/_debug/secret', (_req, res) =>
  res.json({ head: s.slice(0, 4), tail: s.slice(-4), len: s.length })
);

// อ่านโครงสร้าง token (ไม่ verify)
app.get('/api/_debug/token-info', (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    const tok = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
    if (!tok) return res.status(400).json({ error: 'no token' });

    const parts = tok.split('.');
    if (parts.length !== 3 && parts.length !== 5) {
      return res.status(400).json({ error: 'not a compact JWS/JWE', parts: parts.length });
    }

    const b64urlToUtf8 = (seg) => {
      let s = (seg || '').replace(/-/g, '+').replace(/_/g, '/');
      const pad = s.length % 4;
      if (pad) s += '='.repeat(4 - pad);
      return Buffer.from(s, 'base64').toString('utf8');
    };
    const safeParse = (str) => {
      try {
        return JSON.parse(str);
      } catch {
        return { _raw: str, _parseError: true };
      }
    };

    const now = Math.floor(Date.now() / 1000);
    let header = null;
    let payload = null;

    if (parts.length === 3) {
      // JWS
      header = safeParse(b64urlToUtf8(parts[0]));
      payload = safeParse(b64urlToUtf8(parts[1]));
    } else {
      // JWE
      header = safeParse(b64urlToUtf8(parts[0]));
      payload = { _note: 'JWE payload is encrypted; use /api/_debug/me to decrypt & verify' };
    }

    const iat = payload && payload.iat;
    const exp = payload && payload.exp;

    return res.json({
      compactParts: parts.length,
      header,
      payload,
      now,
      skew_sec: iat ? now - iat : null,
      ttl_sec: exp ? exp - now : null,
      lengths: parts.map((p) => p.length),
    });
  } catch (e) {
    return res.status(200).json({ error: String(e), _note: 'handled without throwing 500' });
  }
});

// verify/decrypt token จริง ๆ
app.get('/api/_debug/me', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
    if (!token) return res.status(401).json({ error: 'Missing token' });

    const parts = token.split('.').length;

    if (parts === 5) {
      // JWE
      const { payload, protectedHeader } = await jwtDecrypt(token, secret, { clockTolerance: 60 });
      if (!payload.id && payload.sub) payload.id = String(payload.sub);
      return res.json({ ok: true, kind: 'jwe', header: protectedHeader, user: payload });
    }

    if (parts === 3) {
      // JWS
      const { payload, protectedHeader } = await jwtVerify(token, secret, {
        algorithms: ['HS256', 'HS512'],
        clockTolerance: 60,
      });
      if (!payload.id && payload.sub) payload.id = String(payload.sub);
      return res.json({ ok: true, kind: 'jws', header: protectedHeader, user: payload });
    }

    return res.status(400).json({ error: 'Not a compact JWS/JWE', parts });
  } catch (e) {
    return res.status(401).json({
      error: 'Unauthorized',
      reason: e.code || e.name || String(e),
    });
  }
});

/* ================== START SERVER ================== */

const port = process.env.PORT || 8000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

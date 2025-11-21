// backend/__test__/punishment.test.js
const request = require("supertest");
const express = require("express");

// ---------- mock PrismaClient ----------
const mockPrisma = {
  user_punishment: {
    create: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  users: {
    findMany: jest.fn(),
  },
};

jest.mock("@prisma/client", () => {
  const PrismaClient = jest.fn(() => mockPrisma);
  return { PrismaClient };
});

// ---------- mock auth middlewares ----------
jest.mock("../auth_mw", () => {
  const requireAdmin = jest.fn((req, _res, next) => {
    req.user = { id: "admin-1", role: "admin" };
    next();
  });
  const requireMember = jest.fn((req, _res, next) => {
    req.user = { id: "user-1", role: "member" };
    next();
  });
  return { requireAdmin, requireMember };
});

const { requireAdmin, requireMember } = require("../auth_mw");
const punishmentRouter = require("../punishment_api");

// helper สร้าง app สำหรับเทส
function createApp(options = {}) {
  const { nullifyIp = false } = options;
  const app = express();
  app.use(express.json());

  // สำหรับเคส /public หรือ /me ที่อยากให้ ip เป็น null
  if (nullifyIp) {
    app.use((req, _res, next) => {
      req.ip = null;
      if (req.connection) {
        req.connection.remoteAddress = null;
      }
      next();
    });
  }

  app.use("/api/punish", punishmentRouter);
  return app;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("Punishment API", () => {
  /* ---------- POST /api/punish ---------- */

  it("POST /api/punish - invalid kind", async () => {
    const app = createApp();

    const res = await request(app)
      .post("/api/punish")
      .send({ kind: "whatever" });

    expect(requireAdmin).toHaveBeenCalled();
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid kind");
    expect(mockPrisma.user_punishment.create).not.toHaveBeenCalled();
  });

  it("POST /api/punish - TIMEOUT requires user_id", async () => {
    const app = createApp();

    const res = await request(app).post("/api/punish").send({
      kind: "timeout",
      minutes: 30,
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe(
      "user_id is required for this punishment"
    );
    expect(mockPrisma.user_punishment.create).not.toHaveBeenCalled();
  });

  it("POST /api/punish - BAN_IP requires ip_address", async () => {
    const app = createApp();

    const res = await request(app).post("/api/punish").send({
      kind: "ban_ip",
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("ip_address is required for BAN_IP");
    expect(mockPrisma.user_punishment.create).not.toHaveBeenCalled();
  });

  it("POST /api/punish - BAN_USER with reason", async () => {
    const app = createApp();

    const created = {
      id: 1,
      user_id: "u1",
      ip_address: null,
      type: "BAN_USER",
      reason: "toxic",
      expires_at: null,
      created_by: "admin-1",
      created_at: new Date(),
      revoked_at: null,
      revoked_by: null,
    };

    mockPrisma.user_punishment.create.mockResolvedValue(created);

    const res = await request(app).post("/api/punish").send({
      user_id: "u1",
      kind: "ban_user",
      reason: "toxic",
    });

    expect(mockPrisma.user_punishment.create).toHaveBeenCalledTimes(1);
    const arg = mockPrisma.user_punishment.create.mock.calls[0][0].data;

    expect(arg).toMatchObject({
      user_id: "u1",
      ip_address: null,
      type: "BAN_USER",
      reason: "toxic",
      created_by: "admin-1",
    });
    expect(arg.expires_at).toBeNull();

    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
    expect(res.body.kind).toBe("ban_user");
    expect(res.body.punishment).toEqual(created);
  });

  it("POST /api/punish - TIMEOUT with report_id uses auto reason & expires_at is Date", async () => {
    const app = createApp();

    mockPrisma.user_punishment.create.mockImplementation(async ({ data }) => ({
      id: 2,
      ...data,
      created_at: new Date(),
      revoked_at: null,
      revoked_by: null,
    }));

    const res = await request(app).post("/api/punish").send({
      user_id: "u2",
      kind: "timeout",
      minutes: 30,
      report_id: 123,
    });

    expect(mockPrisma.user_punishment.create).toHaveBeenCalledTimes(1);
    const data = mockPrisma.user_punishment.create.mock.calls[0][0].data;

    expect(data.type).toBe("TIMEOUT");
    expect(data.user_id).toBe("u2");
    expect(data.reason).toBe("Auto punishment from report #123");
    expect(data.expires_at).toBeInstanceOf(Date);
    expect(data.created_by).toBe("admin-1");

    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
    expect(res.body.kind).toBe("timeout");
  });

  it("POST /api/punish - BAN_IP ok", async () => {
    const app = createApp();

    mockPrisma.user_punishment.create.mockResolvedValue({
      id: 3,
      user_id: null,
      ip_address: "1.2.3.4",
      type: "BAN_IP",
      reason: null,
      expires_at: null,
      created_by: "admin-1",
      created_at: new Date(),
      revoked_at: null,
      revoked_by: null,
    });

    const res = await request(app).post("/api/punish").send({
      kind: "ban_ip",
      ip_address: "1.2.3.4",
    });

    expect(mockPrisma.user_punishment.create).toHaveBeenCalledTimes(1);
    const data = mockPrisma.user_punishment.create.mock.calls[0][0].data;

    expect(data).toMatchObject({
      user_id: null,
      ip_address: "1.2.3.4",
      type: "BAN_IP",
      created_by: "admin-1",
    });

    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
    expect(res.body.kind).toBe("ban_ip");
  });

  it("POST /api/punish - prisma error -> 500", async () => {
    const app = createApp();

    mockPrisma.user_punishment.create.mockRejectedValue(
      new Error("DB error")
    );

    const res = await request(app).post("/api/punish").send({
      user_id: "u1",
      kind: "ban_user",
    });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Create punishment failed");
  });

  /* ---------- GET /api/punish ---------- */

  it("GET /api/punish - default (active only) and map login_name / kind / until", async () => {
    const app = createApp();

    const p1 = {
      id: 1,
      user_id: "u1",
      ip_address: null,
      type: "TIMEOUT",
      reason: "r1",
      created_at: new Date(),
      expires_at: new Date(Date.now() + 3600_000),
      revoked_at: null,
      revoked_by: null,
    };
    const p2 = {
      id: 2,
      user_id: "u2",
      ip_address: null,
      type: "BAN_IP",
      reason: "r2",
      created_at: new Date(),
      expires_at: null,
      revoked_at: null,
      revoked_by: null,
    };

    mockPrisma.user_punishment.findMany.mockResolvedValue([p1, p2]);
    mockPrisma.users.findMany.mockResolvedValue([
      { user_id: "u1", login_name: "alice" },
    ]);

    const res = await request(app).get("/api/punish");

    expect(requireAdmin).toHaveBeenCalled();
    expect(mockPrisma.user_punishment.findMany).toHaveBeenCalledTimes(1);

    const args = mockPrisma.user_punishment.findMany.mock.calls[0][0];
    expect(args.orderBy).toEqual({ id: "desc" });
    expect(args.where.revoked_at).toBeNull();
    expect(Array.isArray(args.where.OR)).toBe(true);

    // map login_name / kind
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.items).toHaveLength(2);

    const item1 = res.body.items[0];
    expect(item1.id).toBe(1);
    expect(item1.kind).toBe("timeout");
    expect(item1.login_name).toBe("alice");
    expect(item1.until).toEqual(p1.expires_at);

    const item2 = res.body.items[1];
    expect(item2.id).toBe(2);
    expect(item2.kind).toBe("ban_ip");
    expect(item2.login_name).toBeNull();
  });

  it("GET /api/punish - includeExpired=1 -> where = {}", async () => {
    const app = createApp();

    mockPrisma.user_punishment.findMany.mockResolvedValue([]);
    mockPrisma.users.findMany.mockResolvedValue([]);

    const res = await request(app).get("/api/punish?includeExpired=1");

    const args = mockPrisma.user_punishment.findMany.mock.calls[0][0];
    expect(args.where).toEqual({});
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it("GET /api/punish - prisma error -> 500", async () => {
    const app = createApp();

    mockPrisma.user_punishment.findMany.mockRejectedValue(
      new Error("DB error")
    );

    const res = await request(app).get("/api/punish");

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Failed to load punishments");
  });

  /* ---------- PATCH /api/punish/:id/unban ---------- */

  it("PATCH /api/punish/:id/unban - invalid id", async () => {
    const app = createApp();

    const res = await request(app).patch("/api/punish/abc/unban");

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid punishment id");
    expect(mockPrisma.user_punishment.update).not.toHaveBeenCalled();
  });

  it("PATCH /api/punish/:id/unban - success", async () => {
    const app = createApp();

    const now = new Date();
    const updated = {
      id: 1,
      user_id: "u1",
      ip_address: null,
      type: "TIMEOUT",
      reason: "r1",
      created_at: new Date(),
      expires_at: now,
      revoked_at: now,
      revoked_by: "admin-1",
    };

    mockPrisma.user_punishment.update.mockResolvedValue(updated);

    const res = await request(app).patch("/api/punish/1/unban");

    expect(mockPrisma.user_punishment.update).toHaveBeenCalledTimes(1);
    const arg = mockPrisma.user_punishment.update.mock.calls[0][0];

    expect(arg.where).toEqual({ id: 1 });
    expect(arg.data.revoked_by).toBe("admin-1");
    expect(arg.data.revoked_at).toBeInstanceOf(Date);
    expect(arg.data.expires_at).toBeInstanceOf(Date);

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.punishment).toEqual(updated);
  });

  it("PATCH /api/punish/:id/unban - P2025 -> 404", async () => {
    const app = createApp();

    const err = new Error("not found");
    err.code = "P2025";
    mockPrisma.user_punishment.update.mockRejectedValue(err);

    const res = await request(app).patch("/api/punish/1/unban");

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Punishment not found");
  });

  it("PATCH /api/punish/:id/unban - other error -> 500", async () => {
    const app = createApp();

    mockPrisma.user_punishment.update.mockRejectedValue(
      new Error("DB error")
    );

    const res = await request(app).patch("/api/punish/1/unban");

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Failed to unban");
  });

  /* ---------- GET /api/punish/me ---------- */

  it("GET /api/punish/me - returns only active TIMEOUT/BAN_USER/BAN_IP for user & ip", async () => {
    const app = createApp();

    const future = new Date(Date.now() + 3600_000);
    const past = new Date(Date.now() - 3600_000);

    mockPrisma.user_punishment.findMany.mockResolvedValue([
      {
        id: 1,
        user_id: "user-1",
        ip_address: null,
        type: "TIMEOUT",
        reason: "r1",
        created_at: new Date(),
        expires_at: future,
        revoked_at: null,
      },
      {
        id: 2,
        user_id: "user-1",
        ip_address: null,
        type: "TIMEOUT",
        reason: "expired",
        created_at: new Date(),
        expires_at: past,
        revoked_at: null,
      },
      {
        id: 3,
        user_id: "user-1",
        ip_address: null,
        type: "WARN",
        reason: "warn",
        created_at: new Date(),
        expires_at: null,
        revoked_at: null,
      },
    ]);

    const res = await request(app)
      .get("/api/punish/me")
      .set("x-forwarded-for", "10.0.0.1");

    expect(requireMember).toHaveBeenCalled();
    expect(mockPrisma.user_punishment.findMany).toHaveBeenCalledTimes(1);

    const args = mockPrisma.user_punishment.findMany.mock.calls[0][0];
    expect(args.where.revoked_at).toBeNull();
    expect(args.where.OR).toEqual([
      { user_id: "user-1" },
      { ip_address: "10.0.0.1" },
    ]);
    expect(args.orderBy).toEqual({ created_at: "desc" });

    expect(res.status).toBe(200);
    expect(res.body.active).toBe(true);
    expect(res.body.punishments).toHaveLength(1);

    const p = res.body.punishments[0];
    expect(p.id).toBe(1);
    expect(p.type).toBe("TIMEOUT");
    expect(p.reason).toBe("r1");
    expect(p.created_at).toBeDefined();
    expect(p.expires_at).toBeDefined();
  });

  it("GET /api/punish/me - prisma error -> 500", async () => {
    const app = createApp();

    mockPrisma.user_punishment.findMany.mockRejectedValue(
      new Error("DB error")
    );

    const res = await request(app).get("/api/punish/me");

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Failed to check punishment");
  });

  /* ---------- GET /api/punish/public ---------- */

  it("GET /api/punish/public - no userId & no ip -> inactive, no DB call", async () => {
    const app = createApp({ nullifyIp: true });

    const res = await request(app).get("/api/punish/public");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ active: false, punishments: [] });
    expect(mockPrisma.user_punishment.findMany).not.toHaveBeenCalled();
  });

  it("GET /api/punish/public - user_id + ip (common case) filters active only", async () => {
    const app = createApp();

    const future = new Date(Date.now() + 3600_000);
    const past = new Date(Date.now() - 3600_000);

    mockPrisma.user_punishment.findMany.mockResolvedValue([
      {
        id: 1,
        type: "TIMEOUT",
        reason: "r1",
        expires_at: future,
      },
      {
        id: 2,
        type: "BAN_USER",
        reason: "expired",
        expires_at: past,
      },
      {
        id: 3,
        type: "WARN",
        reason: "warn",
        expires_at: null,
      },
    ]);

    const res = await request(app)
      .get("/api/punish/public?user_id=u1")
      .set("x-forwarded-for", "10.0.0.1");

    const args = mockPrisma.user_punishment.findMany.mock.calls[0][0];
    expect(args.where.revoked_at).toBeNull();
    expect(args.where.OR[0]).toEqual({ user_id: "u1" });
    expect(args.where.OR[1]).toHaveProperty("ip_address");

    expect(res.status).toBe(200);
    expect(res.body.active).toBe(true);
    expect(res.body.punishments).toHaveLength(1);

    const p = res.body.punishments[0];
    expect(p.id).toBe(1);
    expect(p.type).toBe("TIMEOUT");
    expect(p.reason).toBe("r1");
  });

  it("GET /api/punish/public - ip only", async () => {
    const app = createApp({ nullifyIp: true });

    mockPrisma.user_punishment.findMany.mockResolvedValue([]);

    const res = await request(app)
      .get("/api/punish/public")
      .set("x-forwarded-for", "10.0.0.1");

    const args = mockPrisma.user_punishment.findMany.mock.calls[0][0];
    expect(args.where).toEqual({
      revoked_at: null,
      ip_address: "10.0.0.1",
    });

    expect(res.status).toBe(200);
    expect(res.body.active).toBe(false);
  });

  it("GET /api/punish/public - user only", async () => {
    const app = createApp({ nullifyIp: true });

    mockPrisma.user_punishment.findMany.mockResolvedValue([]);

    const res = await request(app).get("/api/punish/public?user_id=u1");

    const args = mockPrisma.user_punishment.findMany.mock.calls[0][0];
    expect(args.where).toEqual({
      revoked_at: null,
      user_id: "u1",
    });

    expect(res.status).toBe(200);
    expect(res.body.active).toBe(false);
  });

  it("GET /api/punish/public - prisma error -> 500", async () => {
    const app = createApp();

    mockPrisma.user_punishment.findMany.mockRejectedValue(
      new Error("DB error")
    );

    const res = await request(app)
      .get("/api/punish/public?user_id=u1")
      .set("x-forwarded-for", "10.0.0.1");

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("failed to check punishment");
    expect(res.body.active).toBe(false);
  });
});

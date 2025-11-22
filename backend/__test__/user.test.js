const request = require("supertest");

jest.mock("../lib/prisma.cjs", () => {
  const mPrisma = {
    users: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      create: jest.fn(),
    },
    note: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
    party_members: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    notifications: {
      create: jest.fn(),
    },
    user_punishment: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  return { prisma: mPrisma };
});

jest.mock("../auth_mw", () => ({
  optionalAuth: (req, _res, next) => next(),
  requireMember: (req, _res, next) => {
    req.user = req.user || { id: "member-1" };
    next();
  },
  requireAdmin: (req, _res, next) => {
    req.user = req.user || { id: "admin-1", role: "admin" };
    next();
  },
  requireAuth: (req, _res, next) => {
    req.user = req.user || { id: "member-1" };
    next();
  },
}));

jest.mock("../punish_mw", () => ({
  ensureNotPunished: (req, _res, next) => next(),
}));

const { prisma } = require("../lib/prisma.cjs");

process.env.NODE_ENV = "test";
const app = require("../index");   


beforeEach(() => {
  jest.clearAllMocks();
});

describe("GET /api/user/by-handle/:handle", () => {
  it("ควรคืน 200 และข้อมูล user เมื่อเจอ handle", async () => {
    const fakeUser = {
      user_id: "u-123",
      login_name: "tester",
      user_name: "Tester",
      img: "/images/pfp.png",
    };

    prisma.users.findFirst.mockResolvedValue(fakeUser);

    const res = await request(app).get("/api/user/by-handle/tester");

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ok: true, user: fakeUser });

    expect(prisma.users.findFirst).toHaveBeenCalledWith({
      where: { login_name: "tester" },
      select: {
        user_id: true,
        login_name: true,
        user_name: true,
        img: true,
      },
    });
  });

  it("ควรคืน 404 เมื่อไม่เจอ handle", async () => {
    prisma.users.findFirst.mockResolvedValue(null);

    const res = await request(app).get("/api/user/by-handle/unknown");

    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ ok: false, error: "NOT_FOUND" });
  });
});

describe("HEAD /api/user/exists/:handle", () => {
  it("ควรคืน 200 ถ้า user นั้นมีอยู่", async () => {
    prisma.users.findUnique.mockResolvedValue({ user_id: "u-123" });

    const res = await request(app).head("/api/user/exists/tester");

    expect(res.statusCode).toBe(200);
  });

  it("ควรคืน 404 ถ้า user นั้นไม่มี", async () => {
    prisma.users.findUnique.mockResolvedValue(null);

    const res = await request(app).head("/api/user/exists/nobody");

    expect(res.statusCode).toBe(404);
  });
});

describe("POST /api/user/validate-handle", () => {
  it("ควรคืน PATTERN ถ้า handle ไม่ผ่าน regex", async () => {
    const res = await request(app)
      .post("/api/user/validate-handle")
      .send({ handle: "ab" }); 

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ok: false, reason: "PATTERN" });
  });

  it("ควรคืน RESERVED ถ้าเป็นคำต้องห้าม (เช่น api)", async () => {
    const res = await request(app)
      .post("/api/user/validate-handle")
      .send({ handle: "api" });

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ok: false, reason: "RESERVED" });
  });

  it("ควรคืน TAKEN ถ้า login_name ซ้ำกับคนอื่น", async () => {
    prisma.users.findUnique.mockResolvedValue({
      user_id: "u-123",
      login_name: "tester",
    });

    const res = await request(app)
      .post("/api/user/validate-handle")
      .send({ handle: "tester" });

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ok: false, reason: "TAKEN" });
  });

  it("ควรคืน ok:true ถ้า handle ใช้ได้และไม่ซ้ำ", async () => {
    prisma.users.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post("/api/user/validate-handle")
      .send({ handle: "new_user01" });

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});

describe("GET /api/user/:id", () => {
  it("ควรคืน user เมื่อพบ", async () => {
    const fakeUser = {
      user_id: "u-999",
      user_name: "Anon",
    };

    prisma.users.findUnique.mockResolvedValue(fakeUser);

    const res = await request(app).get("/api/user/u-999");

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(fakeUser);
    expect(prisma.users.findUnique).toHaveBeenCalledWith({
      where: { user_id: "u-999" },
    });
  });

  it("ควรคืน 404 เมื่อไม่พบ user", async () => {
    prisma.users.findUnique.mockResolvedValue(null);

    const res = await request(app).get("/api/user/u-notfound");

    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ error: "User not found" });
  });
});

describe("PUT /api/user/:userId", () => {
  it("ควร upsert user ใหม่ (โหมด anonymous) แล้วคืนข้อมูลกลับมา", async () => {
    prisma.users.findUnique.mockResolvedValue(null);

    const upsertResult = {
      user_id: "anon-123",
      user_name: "New Name",
      img: "/images/new.png",
      role: "anonymous",
    };
    prisma.users.upsert.mockResolvedValue(upsertResult);

    const res = await request(app)
      .put("/api/user/anon-123")
      .send({ name: "New Name", img: "/images/new.png" });

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ok: true, user: upsertResult });

    expect(prisma.users.upsert).toHaveBeenCalledWith({
      where: { user_id: "anon-123" },
      update: {
        user_name: "New Name",
        img: "/images/new.png",
      },
      create: {
        user_id: "anon-123",
        user_name: "New Name",
        img: "/images/new.png",
        role: "anonymous",
      },
      select: { user_id: true, user_name: true, img: true, role: true },
    });
  });

  it("ควรคืน 400 ถ้าไม่ได้ส่ง name / img อะไรมาเลย", async () => {
    const res = await request(app)
      .put("/api/user/anon-123")
      .send({}); 

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({
      error: "Nothing to update (name or img required)",
    });
  });
});

const request = require("supertest");

jest.mock("@prisma/client", () => {
  const mPrisma = {
    note: {
      deleteMany: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    users: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
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
    $transaction: jest.fn(),
  };

  return {
    PrismaClient: jest.fn(() => mPrisma),
  };
});

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

process.env.NODE_ENV = "test";
const app = require("../index"); 

beforeEach(() => {
  jest.clearAllMocks();
});

describe("GET /api/note", () => {
  it("ควรลบ note ที่เก่ากว่า 1 วัน แล้วส่ง list ของ note กลับมา", async () => {
    prisma.note.deleteMany.mockResolvedValue({ count: 0 });

    const fakeNotes = [
      {
        note_id: 1,
        max_party: 0,
        crr_party: 0,
        message: "hello from test",
        user_id: "u-12345678-1234-1234-1234-123456789012",
        created_at: new Date().toISOString(),
        users: {
          user_id: "u-12345678-1234-1234-1234-123456789012",
          user_name: "tester",
          img: "/images/pfp.png",
        },
      },
    ];

    prisma.note.findMany.mockResolvedValue(fakeNotes);

    const res = await request(app).get("/api/note");

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toEqual(fakeNotes);

    expect(prisma.note.deleteMany).toHaveBeenCalledTimes(1);
    expect(prisma.note.deleteMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          created_at: expect.objectContaining({
            lt: expect.any(Date),
          }),
        }),
      })
    );

    expect(prisma.note.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.note.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          created_at: expect.objectContaining({
            gte: expect.any(Date),
          }),
        }),
        orderBy: { note_id: "desc" },
        include: {
          users: { select: { user_id: true, user_name: true, img: true } },
        },
      })
    );
  });
});

describe("GET /api/note/:id", () => {
  it("ควรส่ง note กลับมาเมื่อพบ (200)", async () => {
    const fakeNote = {
      note_id: 42,
      max_party: 0,
      crr_party: 0,
      message: "single note",
      user_id: "u-00000000-0000-0000-0000-000000000000",
      created_at: new Date().toISOString(),
      users: {
        user_id: "u-00000000-0000-0000-0000-000000000000",
        user_name: "tester",
        img: "/images/pfp.png",
      },
    };

    prisma.note.findUnique.mockResolvedValue(fakeNote);

    const res = await request(app).get("/api/note/42");

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(fakeNote);

    expect(prisma.note.findUnique).toHaveBeenCalledTimes(1);
    expect(prisma.note.findUnique).toHaveBeenCalledWith({
      where: { note_id: 42 },
      include: {
        users: { select: { user_id: true, user_name: true, img: true } },
      },
    });
  });

  it("ควรส่ง 404 เมื่อไม่พบ note", async () => {
    prisma.note.findUnique.mockResolvedValue(null);

    const res = await request(app).get("/api/note/9999");

    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ error: "Note not found" });
  });
});

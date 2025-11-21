// backend/__test__/party_chat.test.js
const request = require("supertest");
const express = require("express");

// ---------- mock PrismaClient ----------

const mockPrisma = {
  note: {
    findUnique: jest.fn(),
  },
  party_members: {
    findFirst: jest.fn(),
  },
  party_messages: {
    findMany: jest.fn(),
    create: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
  },
};

jest.mock("@prisma/client", () => {
  return {
    PrismaClient: jest.fn(() => mockPrisma),
  };
});

// ---------- mock punish_mw ----------

jest.mock("../punish_mw", () => {
  const ensureNotPunished = jest.fn((_req, _res, next) => next());
  return { ensureNotPunished };
});

const { ensureNotPunished } = require("../punish_mw");
const partyChatRouter = require("../party_chat_api");

// helper ให้ทุก request มี req.user.id แบบ fake
function createApp(userId = "user-1") {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    if (userId) req.user = { id: userId };
    next();
  });
  app.use("/api/chat", partyChatRouter);
  return app;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("Party chat API", () => {
  /* ----------------------- GET /api/chat/party/:noteId ----------------------- */

  it("GET /party/:noteId - 400 invalid note_id", async () => {
    const app = createApp();
    const res = await request(app).get("/api/chat/party/abc");

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("invalid note_id");
    expect(mockPrisma.note.findUnique).not.toHaveBeenCalled();
  });

  it("GET /party/:noteId - 403 when not a party member", async () => {
    mockPrisma.note.findUnique.mockResolvedValue({
      user_id: "owner-1",
      max_party: 5,
    });
    mockPrisma.party_members.findFirst.mockResolvedValue(null);

    const app = createApp("visitor");
    const res = await request(app).get("/api/chat/party/1");

    expect(mockPrisma.note.findUnique).toHaveBeenCalledWith({
      where: { note_id: 1 },
      select: { user_id: true, max_party: true },
    });
    expect(res.status).toBe(403);
    expect(res.body.error).toBe("not a party member");
    expect(mockPrisma.party_messages.findMany).not.toHaveBeenCalled();
  });

  it("GET /party/:noteId - 200 for owner/member and map messages with login_name", async () => {
    const now = new Date();

    // user-1 เป็น owner ของ note 1
    mockPrisma.note.findUnique.mockResolvedValue({
      user_id: "user-1",
      max_party: 5,
    });

    mockPrisma.party_members.findFirst.mockResolvedValue(null); // ไม่ถูกใช้จริง ๆ

    mockPrisma.party_messages.findMany.mockResolvedValue([
      {
        message_id: 1,
        note_id: 1,
        user_id: "user-1",
        content: "hello",
        created_at: now,
        user: {
          user_id: "user-1",
          user_name: "Alice",
          img: "/avatars/a.png",
          login_name: "alice",
        },
      },
      {
        message_id: 2,
        note_id: 1,
        user_id: "user-2",
        content: "hi",
        created_at: new Date(now.getTime() + 1000),
        user: {
          user_id: "user-2",
          user_name: null,
          img: null,
          login_name: null,
        },
      },
    ]);

    const app = createApp("user-1");
    const res = await request(app).get("/api/chat/party/1?cursor=1&limit=10");

    expect(mockPrisma.party_messages.findMany).toHaveBeenCalledWith({
      where: { note_id: 1, message_id: { gt: 1 } },
      orderBy: { message_id: "asc" },
      take: 10,
      include: {
        user: {
          select: {
            user_id: true,
            user_name: true,
            img: true,
            login_name: true,
          },
        },
      },
    });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.messages)).toBe(true);
    expect(res.body.messages).toHaveLength(2);

    const m1 = res.body.messages[0];
    expect(m1.message_id).toBe(1);
    expect(m1.user_id).toBe("user-1");
    expect(m1.user_name).toBe("Alice");
    expect(m1.img).toBe("/avatars/a.png");
    expect(m1.login_name).toBe("alice");
    expect(m1.content).toBe("hello");

    const m2 = res.body.messages[1];
    expect(m2.user_id).toBe("user-2");
    expect(m2.user_name).toBe("anonymous"); // fallback
    expect(m2.img).toBeNull();
    expect(m2.login_name).toBeNull();
  });

  it("GET /party/:noteId - 500 when prisma throws", async () => {
    mockPrisma.note.findUnique.mockResolvedValue({
      user_id: "user-1",
      max_party: 5,
    });
    mockPrisma.party_members.findFirst.mockResolvedValue(null);
    mockPrisma.party_messages.findMany.mockRejectedValue(
      new Error("DB error")
    );

    const app = createApp("user-1");
    const res = await request(app).get("/api/chat/party/1");

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("fetch party messages failed");
  });

  /* ----------------------- POST /api/chat/party/:noteId ----------------------- */

  it("POST /party/:noteId - 400 invalid note_id", async () => {
    const app = createApp("user-1");
    const res = await request(app)
      .post("/api/chat/party/abc")
      .send({ content: "hi" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("invalid note_id");
    expect(mockPrisma.note.findUnique).not.toHaveBeenCalled();
  });

  it("POST /party/:noteId - 400 when content missing", async () => {
    const app = createApp("user-1");
    const res = await request(app)
      .post("/api/chat/party/1")
      .send({ content: "   " });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("content is required");
    expect(mockPrisma.note.findUnique).not.toHaveBeenCalled();
  });

  it("POST /party/:noteId - blocked by ensureNotPunished", async () => {
    ensureNotPunished.mockImplementationOnce((_req, res, _next) =>
      res.status(403).json({ error: "punished" })
    );

    const app = createApp("user-1");
    const res = await request(app)
      .post("/api/chat/party/1")
      .send({ content: "hi" });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("punished");
    expect(mockPrisma.note.findUnique).not.toHaveBeenCalled();
    expect(mockPrisma.party_messages.create).not.toHaveBeenCalled();
  });

  it("POST /party/:noteId - 403 when not a party member", async () => {
    mockPrisma.note.findUnique.mockResolvedValue({
      user_id: "owner-1",
      max_party: 5,
    });
    mockPrisma.party_members.findFirst.mockResolvedValue(null);

    const app = createApp("visitor");
    const res = await request(app)
      .post("/api/chat/party/1")
      .send({ content: "hello" });

    expect(mockPrisma.note.findUnique).toHaveBeenCalled();
    expect(res.status).toBe(403);
    expect(res.body.error).toBe("not a party member");
    expect(mockPrisma.party_messages.create).not.toHaveBeenCalled();
  });

  it("POST /party/:noteId - 201 for owner, returns mapped message with login_name", async () => {
    const now = new Date();

    // user-1 เป็น owner
    mockPrisma.note.findUnique.mockResolvedValue({
      user_id: "user-1",
      max_party: 5,
    });
    mockPrisma.party_members.findFirst.mockResolvedValue(null);

    mockPrisma.party_messages.create.mockResolvedValue({
      message_id: 10,
      note_id: 1,
      user_id: "user-1",
      content: "hello party",
      created_at: now,
      user: {
        user_name: "Alice",
        img: "/avatars/a.png",
        login_name: "alice",
      },
    });

    const app = createApp("user-1");
    const res = await request(app)
      .post("/api/chat/party/1")
      .send({ content: "hello party" });

    expect(ensureNotPunished).toHaveBeenCalled();
    expect(mockPrisma.party_messages.create).toHaveBeenCalledWith({
      data: { note_id: 1, user_id: "user-1", content: "hello party" },
      include: {
        user: {
          select: {
            user_name: true,
            img: true,
            login_name: true,
          },
        },
      },
    });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe("sent");
    expect(res.body.value.message_id).toBe(10);
    expect(res.body.value.user_id).toBe("user-1");
    expect(res.body.value.user_name).toBe("Alice");
    expect(res.body.value.img).toBe("/avatars/a.png");
    expect(res.body.value.login_name).toBe("alice");
    expect(res.body.value.content).toBe("hello party");
  });

  it("POST /party/:noteId - 500 when prisma throws", async () => {
    mockPrisma.note.findUnique.mockResolvedValue({
      user_id: "user-1",
      max_party: 5,
    });
    mockPrisma.party_members.findFirst.mockResolvedValue(null);
    mockPrisma.party_messages.create.mockRejectedValue(
      new Error("DB error")
    );

    const app = createApp("user-1");
    const res = await request(app)
      .post("/api/chat/party/1")
      .send({ content: "hello" });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("send message failed");
  });

  /* ----------------------- DELETE /api/chat/party/:noteId/:messageId ----------------------- */

  it("DELETE /party/:noteId/:messageId - 400 invalid params", async () => {
    const app = createApp("user-1");
    const res = await request(app).delete("/api/chat/party/abc/1");

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("invalid params");
    expect(mockPrisma.note.findUnique).not.toHaveBeenCalled();
  });

  it("DELETE /party/:noteId/:messageId - 403 when not a party member", async () => {
    mockPrisma.note.findUnique.mockResolvedValue({
      user_id: "owner-1",
      max_party: 5,
    });
    mockPrisma.party_members.findFirst.mockResolvedValue(null);

    const app = createApp("visitor");
    const res = await request(app).delete("/api/chat/party/1/100");

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("not a party member");
    expect(mockPrisma.party_messages.findUnique).not.toHaveBeenCalled();
  });

  it("DELETE /party/:noteId/:messageId - 404 when message not found", async () => {
    mockPrisma.note.findUnique.mockResolvedValue({
      user_id: "user-1",
      max_party: 5,
    });
    mockPrisma.party_members.findFirst.mockResolvedValue(null);
    mockPrisma.party_messages.findUnique.mockResolvedValue(null);

    const app = createApp("user-1");
    const res = await request(app).delete("/api/chat/party/1/100");

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("message not found");
  });

  it("DELETE /party/:noteId/:messageId - 400 note mismatch", async () => {
    mockPrisma.note.findUnique.mockResolvedValue({
      user_id: "user-1",
      max_party: 5,
    });
    mockPrisma.party_members.findFirst.mockResolvedValue(null);
    mockPrisma.party_messages.findUnique.mockResolvedValue({
      user_id: "user-1",
      note_id: 999, // ไม่ตรงกับ noteId ที่ path ส่งมา
    });

    const app = createApp("user-1");
    const res = await request(app).delete("/api/chat/party/1/100");

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("note mismatch");
    expect(mockPrisma.party_messages.delete).not.toHaveBeenCalled();
  });

  it("DELETE /party/:noteId/:messageId - 403 when deleting others message", async () => {
    mockPrisma.note.findUnique.mockResolvedValue({
      user_id: "user-1",
      max_party: 5,
    });
    mockPrisma.party_members.findFirst.mockResolvedValue(null);
    mockPrisma.party_messages.findUnique.mockResolvedValue({
      user_id: "someone-else",
      note_id: 1,
    });

    const app = createApp("user-1");
    const res = await request(app).delete("/api/chat/party/1/100");

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("can delete own message only");
    expect(mockPrisma.party_messages.delete).not.toHaveBeenCalled();
  });

  it("DELETE /party/:noteId/:messageId - 200 delete own message", async () => {
    mockPrisma.note.findUnique.mockResolvedValue({
      user_id: "user-1",
      max_party: 5,
    });
    mockPrisma.party_members.findFirst.mockResolvedValue(null);
    mockPrisma.party_messages.findUnique.mockResolvedValue({
      user_id: "user-1",
      note_id: 1,
    });
    mockPrisma.party_messages.delete.mockResolvedValue({});

    const app = createApp("user-1");
    const res = await request(app).delete("/api/chat/party/1/100");

    expect(mockPrisma.party_messages.delete).toHaveBeenCalledWith({
      where: { message_id: 100 },
    });
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("deleted");
  });

  it("DELETE /party/:noteId/:messageId - 500 when prisma throws", async () => {
    mockPrisma.note.findUnique.mockResolvedValue({
      user_id: "user-1",
      max_party: 5,
    });
    mockPrisma.party_members.findFirst.mockResolvedValue(null);
    mockPrisma.party_messages.findUnique.mockResolvedValue({
      user_id: "user-1",
      note_id: 1,
    });
    mockPrisma.party_messages.delete.mockRejectedValue(
      new Error("DB error")
    );

    const app = createApp("user-1");
    const res = await request(app).delete("/api/chat/party/1/100");

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("delete message failed");
  });
});

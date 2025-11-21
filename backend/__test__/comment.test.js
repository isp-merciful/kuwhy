const request = require("supertest");
const express = require("express");

jest.mock("../lib/prisma.cjs", () => ({
  prisma: {
    comment: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    users: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock("../punish_mw", () => ({
  ensureNotPunished: jest.fn((req, res, next) => next()),
}));

const { prisma } = require("../lib/prisma.cjs");
const { ensureNotPunished } = require("../punish_mw");
const commentRouter = require("../comment_api");

function createApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/comment", commentRouter);
  return app;
}

describe("Comment API", () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    app = createApp();
  });


  it("GET /api/comment - returns nested tree with user info", async () => {
    const base = new Date("2024-01-01T00:00:00Z");

    prisma.comment.findMany.mockResolvedValue([
      {
        comment_id: 1,
        user_id: "u1",
        message: "root",
        note_id: 10,
        blog_id: null,
        parent_comment_id: null,
        created_at: base,
        updated_at: base,
        users: {
          user_id: "u1",
          user_name: "Alice",
          img: "/avatars/a.png",
          login_name: "alice",
        },
      },
      {
        comment_id: 2,
        user_id: "u2",
        message: "child",
        note_id: 10,
        blog_id: null,
        parent_comment_id: 1,
        created_at: new Date(base.getTime() + 1000),
        updated_at: new Date(base.getTime() + 1000),
        users: {
          user_id: "u2",
          user_name: "Bob",
          img: null,
          login_name: "bob",
        },
      },
    ]);

    const res = await request(app).get("/api/comment");

    expect(res.status).toBe(200);
    expect(prisma.comment.findMany).toHaveBeenCalledWith({
      orderBy: { created_at: "asc" },
      include: {
        users: {
          select: {
            user_id: true,
            user_name: true,
            img: true,
            login_name: true,
          },
        },
      },
    });

    expect(res.body.message).toBe("getallcomment");
    expect(Array.isArray(res.body.comment)).toBe(true);
    expect(res.body.comment).toHaveLength(1);

    const root = res.body.comment[0];
    expect(root.comment_id).toBe(1);
    expect(root.user_name).toBe("Alice");
    expect(root.img).toBe("/avatars/a.png");
    expect(root.login_name).toBe("alice");
    expect(Array.isArray(root.children)).toBe(true);
    expect(root.children).toHaveLength(1);

    const child = root.children[0];
    expect(child.comment_id).toBe(2);
    expect(child.parent_comment_id).toBe(1);
    expect(child.user_name).toBe("Bob");
    expect(child.img).toBeNull();
    expect(child.login_name).toBe("bob");
  });

  it("GET /api/comment - handles prisma error", async () => {
    prisma.comment.findMany.mockRejectedValue(new Error("DB error"));

    const res = await request(app).get("/api/comment");

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("can't fetch note comment");
  });


  it("GET /api/comment/note/:note_id - returns tree for a note", async () => {
    prisma.comment.findMany.mockResolvedValue([
      {
        comment_id: 1,
        user_id: "u1",
        message: "note cmt",
        note_id: 10,
        blog_id: null,
        parent_comment_id: null,
        created_at: new Date(),
        updated_at: new Date(),
        users: {
          user_id: "u1",
          user_name: "Alice",
          img: null,
          login_name: "alice",
        },
      },
    ]);

    const res = await request(app).get("/api/comment/note/10");

    expect(res.status).toBe(200);
    expect(prisma.comment.findMany).toHaveBeenCalledWith({
      where: { note_id: 10 },
      orderBy: { created_at: "asc" },
      include: {
        users: {
          select: {
            user_id: true,
            user_name: true,
            img: true,
            login_name: true,
          },
        },
      },
    });

    expect(res.body.message).toBe("getnote");
    expect(res.body.comment).toHaveLength(1);
    expect(res.body.comment[0].note_id).toBe(10);
  });

  it("GET /api/comment/note/:note_id - handles error", async () => {
    prisma.comment.findMany.mockRejectedValue(new Error("DB error"));

    const res = await request(app).get("/api/comment/note/10");

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("can't fetch note comment");
  });


  it("GET /api/comment/blog/:blog_id - returns tree for a blog", async () => {
    prisma.comment.findMany.mockResolvedValue([
      {
        comment_id: 1,
        user_id: "u1",
        message: "blog cmt",
        note_id: null,
        blog_id: 5,
        parent_comment_id: null,
        created_at: new Date(),
        updated_at: new Date(),
        users: {
          user_id: "u1",
          user_name: "Alice",
          img: null,
          login_name: "alice",
        },
      },
    ]);

    const res = await request(app).get("/api/comment/blog/5");

    expect(res.status).toBe(200);
    expect(prisma.comment.findMany).toHaveBeenCalledWith({
      where: { blog_id: 5 },
      orderBy: { created_at: "asc" },
      include: {
        users: {
          select: {
            user_id: true,
            user_name: true,
            img: true,
            login_name: true,
          },
        },
      },
    });

    expect(res.body.message).toBe("getblog");
    expect(res.body.comment).toHaveLength(1);
    expect(res.body.comment[0].blog_id).toBe(5);
  });

  it("GET /api/comment/blog/:blog_id - handles error", async () => {
    prisma.comment.findMany.mockRejectedValue(new Error("DB error"));

    const res = await request(app).get("/api/comment/blog/5");

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("DB error");
  });


  it("POST /api/comment - missing fields", async () => {
    const res = await request(app).post("/api/comment").send({});

    expect(res.status).toBe(400);
    expect(res.body.error_code).toBe("MISSING_FIELDS");
    expect(ensureNotPunished).toHaveBeenCalled();
    expect(prisma.comment.create).not.toHaveBeenCalled();
  });

  it("POST /api/comment - blog comment requires auth header", async () => {
    const res = await request(app).post("/api/comment").send({
      user_id: "u-blog",
      message: "hi",
      blog_id: 5,
    });

    expect(res.status).toBe(401);
    expect(res.body.error_code).toBe("LOGIN_REQUIRED_FOR_BLOG_COMMENT");
    expect(prisma.users.findUnique).not.toHaveBeenCalled();
    expect(prisma.comment.create).not.toHaveBeenCalled();
  });

  it("POST /api/comment - blog comment requires login_name", async () => {
    prisma.users.findUnique.mockResolvedValue({
      user_id: "u-blog",
      login_name: null,
    });

    const res = await request(app)
      .post("/api/comment")
      .set("Authorization", "Bearer token")
      .send({
        user_id: "u-blog",
        message: "hi",
        blog_id: 5,
      });

    expect(prisma.users.findUnique).toHaveBeenCalledWith({
      where: { user_id: "u-blog" },
      select: { login_name: true },
    });

    expect(res.status).toBe(403);
    expect(res.body.error_code).toBe("LOGIN_NAME_REQUIRED_FOR_BLOG_COMMENT");
    expect(prisma.comment.create).not.toHaveBeenCalled();
  });

  it("POST /api/comment - blog comment ok when auth + login_name", async () => {
    prisma.users.findUnique.mockResolvedValue({
      login_name: "alice",
    });

    prisma.comment.create.mockResolvedValue({
      comment_id: 20,
      user_id: "u-blog2",
      message: "hi blog",
      created_at: "2024-01-01T00:00:00.000Z",
    });

    const res = await request(app)
      .post("/api/comment")
      .set("Authorization", "Bearer token")
      .send({
        user_id: "u-blog2",
        message: "hi blog",
        blog_id: 5,
      });

    expect(prisma.users.findUnique).toHaveBeenCalledWith({
      where: { user_id: "u-blog2" },
      select: { login_name: true },
    });

    expect(prisma.comment.create).toHaveBeenCalledWith({
      data: {
        user_id: "u-blog2",
        message: "hi blog",
        note_id: null,
        blog_id: 5,
        parent_comment_id: null,
      },
      select: {
        comment_id: true,
        user_id: true,
        message: true,
        created_at: true,
      },
    });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("add comment successful");
    expect(res.body.comment.comment_id).toBe(20);
  });

  it("POST /api/comment - create note comment when rate ok", async () => {
    prisma.comment.create.mockResolvedValue({
      comment_id: 1,
      user_id: "u-note",
      message: "hello",
      created_at: "2024-01-01T00:00:00.000Z",
    });

    const res = await request(app).post("/api/comment").send({
      user_id: "u-note",
      message: "hello",
      note_id: 10,
    });

    expect(ensureNotPunished).toHaveBeenCalled();
    expect(prisma.comment.create).toHaveBeenCalledWith({
      data: {
        user_id: "u-note",
        message: "hello",
        note_id: 10,
        blog_id: null,
        parent_comment_id: null,
      },
      select: {
        comment_id: true,
        user_id: true,
        message: true,
        created_at: true,
      },
    });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("add comment successful");
    expect(res.body.comment).toEqual({
      comment_id: 1,
      user_id: "u-note",
      message: "hello",
      created_at: "2024-01-01T00:00:00.000Z",
    });
  });

  it("POST /api/comment - rate limit COMMENT_RATE_LIMIT", async () => {
    prisma.comment.create.mockResolvedValue({
      comment_id: 1,
      user_id: "u-rate",
      message: "first",
      created_at: "2024-01-01T00:00:00.000Z",
    });

    const body = { user_id: "u-rate", message: "hello", note_id: 11 };

    const first = await request(app).post("/api/comment").send(body);
    expect(first.status).toBe(200);

    const second = await request(app).post("/api/comment").send(body);

    expect(second.status).toBe(429);
    expect(second.body.error_code).toBe("COMMENT_RATE_LIMIT");
    expect(prisma.comment.create).toHaveBeenCalledTimes(1);
  });

  it("POST /api/comment - punished user blocked by ensureNotPunished", async () => {
    ensureNotPunished.mockImplementationOnce((_req, res, _next) =>
      res.status(403).json({ error: "punished" })
    );

    const res = await request(app).post("/api/comment").send({
      user_id: "u-ban",
      message: "nope",
      note_id: 99,
    });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("punished");
    expect(prisma.comment.create).not.toHaveBeenCalled();
  });

  it("POST /api/comment - handles prisma error", async () => {
    prisma.comment.create.mockRejectedValue(new Error("DB error"));

    const res = await request(app).post("/api/comment").send({
      user_id: "u-err",
      message: "xx",
      note_id: 1,
    });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("DB error");
  });

  it("PUT /api/comment/:id - validate id & message", async () => {
    // bad id
    let res = await request(app).put("/api/comment/NaN").send({
      message: "x",
    });
    expect(res.status).toBe(400);
    expect(res.body.error_code).toBe("MISSING_ID");

    // invalid message
    res = await request(app).put("/api/comment/1").send({});
    expect(res.status).toBe(400);
    expect(res.body.error_code).toBe("INVALID_MESSAGE");

    expect(prisma.comment.update).not.toHaveBeenCalled();
  });

  it("PUT /api/comment/:id - updates message", async () => {
    prisma.comment.update.mockResolvedValue({});

    const res = await request(app).put("/api/comment/1").send({
      message: " updated ",
    });

    expect(prisma.comment.update).toHaveBeenCalledWith({
      where: { comment_id: 1 },
      data: { message: "updated" },
    });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("updatesuccess");
  });

  it("PUT /api/comment/:id - handles prisma error", async () => {
    prisma.comment.update.mockRejectedValue(new Error("DB error"));

    const res = await request(app).put("/api/comment/1").send({
      message: "test",
    });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Failed to update comment");
  });


  it("DELETE /api/comment/:id - delete ok", async () => {
    prisma.comment.delete.mockResolvedValue({});

    const res = await request(app).delete("/api/comment/1");

    expect(prisma.comment.delete).toHaveBeenCalledWith({
      where: { comment_id: 1 },
    });
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("delete success");
  });

  it("DELETE /api/comment/:id - handles prisma error", async () => {
    prisma.comment.delete.mockRejectedValue(new Error("DB error"));

    const res = await request(app).delete("/api/comment/1");

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("can't deleted");
  });
});

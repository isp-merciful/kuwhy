const request = require("supertest");
const express = require("express");

jest.mock("../auth_mw", () => {
  const requireMember = jest.fn((req, res, next) => {
    const id = req.headers["x-test-user-id"];
    if (!id) {
      return res.status(401).json({ error: "unauthorized" });
    }
    req.user = { id: String(id) };
    return next();
  });

  const optionalAuth = jest.fn((req, _res, next) => {
    const id = req.headers["x-test-user-id"];
    if (id) {
      req.user = { id: String(id) };
    }
    return next();
  });

  return { optionalAuth, requireMember };
});

jest.mock("../punish_mw", () => {
  const ensureNotPunished = jest.fn((_req, _res, next) => next());
  return { ensureNotPunished };
});

jest.mock("../lib/prisma.cjs", () => {
  return {
    prisma: {
      blog: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    },
  };
});

const { prisma } = require("../lib/prisma.cjs");
const { requireMember, optionalAuth } = require("../auth_mw");
const { ensureNotPunished } = require("../punish_mw");
const blogRouter = require("../blog_api");

function createApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/blog", blogRouter);
  return app;
}

describe("Blog API", () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    app = createApp();
  });


  it("GET /api/blog - should return mapped blogs with login_name, attachments, tags", async () => {
    const now = new Date();

    prisma.blog.findMany.mockResolvedValue([
      {
        blog_id: 42,
        blog_title: "Hello",
        message: "World",
        blog_up: null,
        blog_down: null,
        user_id: "user-1",
        created_at: now,
        updated_at: now,
        attachments: [
          {
            url: "/uploads/file.png",
            name: "file.png",
            type: "image/png",
            size: 123,
          },
        ],
        tags: ["tag1", "tag2"],
        users: {
          img: "/images/pfp.png",
          user_name: "Tester",
          login_name: "tester",
        },
      },
    ]);

    const res = await request(app).get("/api/blog");

    expect(res.statusCode).toBe(200);
    expect(optionalAuth).toHaveBeenCalled();
    expect(prisma.blog.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.blog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { blog_id: "desc" },
      })
    );

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(1);

    const b = res.body[0];
    expect(b.blog_id).toBe(42);
    expect(b.blog_title).toBe("Hello");
    expect(b.message).toBe("World");
    expect(b.user_id).toBe("user-1");
    // null -> 0
    expect(b.blog_up).toBe(0);
    expect(b.blog_down).toBe(0);
    expect(b.img).toBe("/images/pfp.png");
    expect(b.user_name).toBe("Tester");
    expect(b.login_name).toBe("tester");
    expect(Array.isArray(b.attachments)).toBe(true);
    expect(Array.isArray(b.tags)).toBe(true);
  });

  it("GET /api/blog - should return 500 when prisma throws", async () => {
    prisma.blog.findMany.mockRejectedValue(new Error("DB error"));

    const res = await request(app).get("/api/blog");

    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe("fetch post fail");
  });


  it("GET /api/blog/:id - should return 400 on bad id", async () => {
    const res = await request(app).get("/api/blog/abc");

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Bad id");
    expect(prisma.blog.findUnique).not.toHaveBeenCalled();
  });

  it("GET /api/blog/:id - should return 404 when not found", async () => {
    prisma.blog.findUnique.mockResolvedValue(null);

    const res = await request(app).get("/api/blog/999");

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe("Not found");
  });

  it("GET /api/blog/:id - should return mapped blog", async () => {
    const now = new Date();
    prisma.blog.findUnique.mockResolvedValue({
      blog_id: 1,
      blog_title: "Title",
      message: "Content",
      blog_up: 5,
      blog_down: 2,
      user_id: "user-1",
      created_at: now,
      updated_at: now,
      attachments: [],
      tags: ["tag1"],
      users: {
        img: "/images/pfp.png",
        user_name: "Tester",
        login_name: "tester",
      },
    });

    const res = await request(app).get("/api/blog/1");

    expect(res.statusCode).toBe(200);
    expect(prisma.blog.findUnique).toHaveBeenCalledWith({
      where: { blog_id: 1 },
      select: expect.any(Object),
    });

    expect(res.body).toMatchObject({
      blog_id: 1,
      blog_title: "Title",
      message: "Content",
      blog_up: 5,
      blog_down: 2,
      user_id: "user-1",
      img: "/images/pfp.png",
      user_name: "Tester",
      login_name: "tester",
      attachments: [],
      tags: ["tag1"],
    });
  });


  it("POST /api/blog - should require auth", async () => {
    const res = await request(app)
      .post("/api/blog")
      .field("blog_title", "X")
      .field("message", "Y");

    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe("unauthorized");
    expect(prisma.blog.create).not.toHaveBeenCalled();
  });

  it("POST /api/blog - should block when ensureNotPunished stops the request", async () => {
    ensureNotPunished.mockImplementationOnce((_req, res, _next) => {
      return res.status(403).json({ error: "punished" });
    });

    const res = await request(app)
      .post("/api/blog")
      .set("x-test-user-id", "user-1")
      .field("blog_title", "X")
      .field("message", "Y");

    expect(res.statusCode).toBe(403);
    expect(res.body.error).toBe("punished");
    expect(prisma.blog.create).not.toHaveBeenCalled();
  });

  it("POST /api/blog - should validate required fields", async () => {
    const res = await request(app)
      .post("/api/blog")
      .set("x-test-user-id", "user-1")
      .field("blog_title", "Only title");

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Missing fields");
    expect(prisma.blog.create).not.toHaveBeenCalled();
  });

  it("POST /api/blog - should create blog with normalized tags", async () => {
    const now = new Date();
    prisma.blog.create.mockResolvedValue({
      blog_id: 1,
      blog_title: "Hello",
      message: "World",
      blog_up: 0,
      blog_down: 0,
      user_id: "user-1",
      created_at: now,
      updated_at: now,
      attachments: null,
      tags: ["tag1", "tag2"],
    });

    const res = await request(app)
      .post("/api/blog")
      .set("x-test-user-id", "user-1")
      .field("blog_title", "Hello")
      .field("message", "World")
      .field("tags", "  tag1 , tag2 ,, ");

    expect(requireMember).toHaveBeenCalled();
    expect(ensureNotPunished).toHaveBeenCalled();

    expect(prisma.blog.create).toHaveBeenCalledTimes(1);
    expect(prisma.blog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          user_id: "user-1",
          blog_title: "Hello",
          message: "World",
          blog_up: 0,
          blog_down: 0,
          tags: ["tag1", "tag2"],
        }),
      })
    );

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe("inserted");
    expect(res.body.insertedId).toBe(1);
    expect(Array.isArray(res.body.uploaded_attachments)).toBe(true);
  });


  it("PUT /api/blog/:id - should require auth", async () => {
    const res = await request(app).put("/api/blog/1").send({
      blog_title: "New",
    });

    expect(res.statusCode).toBe(401);
    expect(prisma.blog.findUnique).not.toHaveBeenCalled();
  });

  it("PUT /api/blog/:id - should return 400 on bad id", async () => {
    const res = await request(app)
      .put("/api/blog/abc")
      .set("x-test-user-id", "user-1")
      .send({ blog_title: "New" });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Bad id");
  });

  it("PUT /api/blog/:id - should return 404 when blog not found", async () => {
    prisma.blog.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .put("/api/blog/1")
      .set("x-test-user-id", "user-1")
      .send({ blog_title: "New" });

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe("Not found");
  });

  it("PUT /api/blog/:id - should forbid editing others blog", async () => {
    prisma.blog.findUnique.mockResolvedValue({
      blog_id: 1,
      user_id: "someone-else",
      attachments: [],
    });

    const res = await request(app)
      .put("/api/blog/1")
      .set("x-test-user-id", "user-1")
      .send({ blog_title: "New" });

    expect(res.statusCode).toBe(403);
    expect(res.body.error).toBe("Forbidden: not your blog");
    expect(prisma.blog.update).not.toHaveBeenCalled();
  });

  it("PUT /api/blog/:id - should return 400 when no fields to update", async () => {
    prisma.blog.findUnique.mockResolvedValue({
      blog_id: 1,
      user_id: "user-1",
      attachments: [],
    });

    const res = await request(app)
      .put("/api/blog/1")
      .set("x-test-user-id", "user-1")
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("No fields to update");
    expect(prisma.blog.update).not.toHaveBeenCalled();
  });

  it("PUT /api/blog/:id - should update title/message/tags and overwrite attachments when attachments_json provided", async () => {
    const now = new Date();

    prisma.blog.findUnique.mockResolvedValue({
      blog_id: 1,
      user_id: "user-1",
      attachments: [
        {
          url: "/uploads/old.txt",
          name: "old.txt",
          type: "text/plain",
          size: 10,
        },
      ],
    });

    prisma.blog.update.mockResolvedValue({
      blog_id: 1,
      blog_title: "New title",
      message: "New content",
      blog_up: 1,
      blog_down: 0,
      user_id: "user-1",
      created_at: now,
      updated_at: now,
      attachments: [],
      tags: ["tag1", "tag2"],
      users: {
        img: "/images/new.png",
        user_name: "Tester",
        login_name: "tester",
      },
    });

    const res = await request(app)
      .put("/api/blog/1")
      .set("x-test-user-id", "user-1")
      .send({
        blog_title: "New title",
        message: "New content",
        tags: "tag1, tag2",
        attachments_json: JSON.stringify([]),
      });

    expect(prisma.blog.findUnique).toHaveBeenCalledWith({
      where: { blog_id: 1 },
      select: {
        blog_id: true,
        user_id: true,
        attachments: true,
      },
    });

    expect(prisma.blog.update).toHaveBeenCalledTimes(1);
    expect(prisma.blog.update).toHaveBeenCalledWith({
      where: { blog_id: 1 },
      data: expect.objectContaining({
        blog_title: "New title",
        message: "New content",
        tags: ["tag1", "tag2"],
        attachments: [], 
      }),
      select: expect.any(Object),
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({
      blog_id: 1,
      blog_title: "New title",
      message: "New content",
      blog_up: 1,
      blog_down: 0,
      user_id: "user-1",
      img: "/images/new.png",
      user_name: "Tester",
      login_name: "tester",
      attachments: [],
      tags: ["tag1", "tag2"],
    });
  });


  it("DELETE /api/blog/:id - should require auth", async () => {
    const res = await request(app).delete("/api/blog/1");

    expect(res.statusCode).toBe(401);
    expect(prisma.blog.findUnique).not.toHaveBeenCalled();
    expect(prisma.blog.delete).not.toHaveBeenCalled();
  });

  it("DELETE /api/blog/:id - should return 400 on bad id", async () => {
    const res = await request(app)
      .delete("/api/blog/abc")
      .set("x-test-user-id", "user-1");

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Bad id");
  });

  it("DELETE /api/blog/:id - should return 404 when not found", async () => {
    prisma.blog.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .delete("/api/blog/1")
      .set("x-test-user-id", "user-1");

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe("Not found");
  });

  it("DELETE /api/blog/:id - should forbid deleting others blog", async () => {
    prisma.blog.findUnique.mockResolvedValue({
      user_id: "someone-else",
    });

    const res = await request(app)
      .delete("/api/blog/1")
      .set("x-test-user-id", "user-1");

    expect(res.statusCode).toBe(403);
    expect(res.body.error).toBe("Forbidden: not your blog");
    expect(prisma.blog.delete).not.toHaveBeenCalled();
  });

  it("DELETE /api/blog/:id - should delete own blog", async () => {
    prisma.blog.findUnique.mockResolvedValue({
      user_id: "user-1",
    });
    prisma.blog.delete.mockResolvedValue({});

    const res = await request(app)
      .delete("/api/blog/1")
      .set("x-test-user-id", "user-1");

    expect(prisma.blog.findUnique).toHaveBeenCalledWith({
      where: { blog_id: 1 },
      select: { user_id: true },
    });
    expect(prisma.blog.delete).toHaveBeenCalledWith({
      where: { blog_id: 1 },
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("delete success");
  });

  it("POST /api/blog/:id/vote-simple - should require auth", async () => {
    const res = await request(app)
      .post("/api/blog/1/vote-simple")
      .send({ prev: null, next: "up" });

    expect(res.statusCode).toBe(401);
    expect(prisma.blog.findUnique).not.toHaveBeenCalled();
  });

  it("POST /api/blog/:id/vote-simple - should return 400 on bad id", async () => {
    const res = await request(app)
      .post("/api/blog/abc/vote-simple")
      .set("x-test-user-id", "user-1")
      .send({ prev: null, next: "up" });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Invalid blog id");
  });

  it("POST /api/blog/:id/vote-simple - should return 404 when blog not found", async () => {
    prisma.blog.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post("/api/blog/1/vote-simple")
      .set("x-test-user-id", "user-1")
      .send({ prev: null, next: "up" });

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe("Blog not found");
  });

  it("POST /api/blog/:id/vote-simple - should handle prev=null -> next='up'", async () => {
    prisma.blog.findUnique.mockResolvedValue({
      blog_up: null,
      blog_down: null,
    });

    prisma.blog.update.mockImplementation(async ({ data }) => {
      return {
        blog_up: data.blog_up,
        blog_down: data.blog_down,
      };
    });

    const res = await request(app)
      .post("/api/blog/1/vote-simple")
      .set("x-test-user-id", "user-1")
      .send({ prev: null, next: "up" });

    expect(prisma.blog.findUnique).toHaveBeenCalledWith({
      where: { blog_id: 1 },
      select: { blog_up: true, blog_down: true },
    });

    expect(prisma.blog.update).toHaveBeenCalledWith({
      where: { blog_id: 1 },
      data: { blog_up: 1, blog_down: 0 },
      select: { blog_up: true, blog_down: true },
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      blog_up: 1,
      blog_down: 0,
      vote: "up",
    });
  });

  it("POST /api/blog/:id/vote-simple - should handle prev='up' -> next=null", async () => {
    prisma.blog.findUnique.mockResolvedValue({
      blog_up: 1,
      blog_down: 0,
    });

    prisma.blog.update.mockImplementation(async ({ data }) => {
      return {
        blog_up: data.blog_up,
        blog_down: data.blog_down,
      };
    });

    const res = await request(app)
      .post("/api/blog/1/vote-simple")
      .set("x-test-user-id", "user-1")
      .send({ prev: "up", next: null });

    expect(prisma.blog.update).toHaveBeenCalledWith({
      where: { blog_id: 1 },
      data: { blog_up: 0, blog_down: 0 },
      select: { blog_up: true, blog_down: true },
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      blog_up: 0,
      blog_down: 0,
      vote: null,
    });
  });
});

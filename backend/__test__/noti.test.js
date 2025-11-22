const request = require("supertest");
const express = require("express");

const mockPrisma = {
  note: {
    findUnique: jest.fn(),
  },
  blog: {
    findUnique: jest.fn(),
  },
  comment: {
    findUnique: jest.fn(),
  },
  party_members: {
    findMany: jest.fn(),
  },
  notifications: {
    create: jest.fn(),
    createMany: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
};

jest.mock("../lib/prisma.cjs", () => ({
  prisma: mockPrisma,
}));

const notificationRouter = require("../notification_api");

describe("Notification API (/api/noti)", () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use("/api/noti", notificationRouter);
  });

  describe("POST /api/noti - party events", () => {
    it("creates party notifications for host and members except sender", async () => {
      mockPrisma.note.findUnique.mockResolvedValue({
        user_id: "host-1",
      });

      mockPrisma.party_members.findMany.mockResolvedValue([
        { user_id: "host-1" },   
        { user_id: "member-1" },
        { user_id: "member-2" },
      ]);

      mockPrisma.notifications.createMany.mockResolvedValue({
        count: 2,
      });

      const res = await request(app)
        .post("/api/noti")
        .send({
          sender_id: "member-1",
          note_id: 123,
          event_type: "party_join",
        })
        .expect(200);

      expect(mockPrisma.note.findUnique).toHaveBeenCalledWith({
        where: { note_id: 123 },
        select: { user_id: true },
      });

      expect(mockPrisma.party_members.findMany).toHaveBeenCalledWith({
        where: { note_id: 123 },
        select: { user_id: true },
      });

      expect(mockPrisma.notifications.createMany).toHaveBeenCalledTimes(1);
      const arg = mockPrisma.notifications.createMany.mock.calls[0][0];

      expect(arg.data).toEqual([
        {
          recipient_id: "host-1",
          sender_id: "member-1",
          note_id: 123,
          blog_id: null,
          comment_id: null,
          parent_comment_id: null,
          type: "party_join",
          is_read: false,
        },
        {
          recipient_id: "member-2",
          sender_id: "member-1",
          note_id: 123,
          blog_id: null,
          comment_id: null,
          parent_comment_id: null,
          type: "party_join",
          is_read: false,
        },
      ]);

      expect(res.body).toEqual({
        message: "party notifications created",
        count: 2,
      });
    });

    it("returns 'no notification needed' when party event has no other recipients", async () => {
      mockPrisma.note.findUnique.mockResolvedValue({
        user_id: "solo-user",
      });

      mockPrisma.party_members.findMany.mockResolvedValue([
        { user_id: "solo-user" },
      ]);

      const res = await request(app)
        .post("/api/noti")
        .send({
          sender_id: "solo-user",
          note_id: 123,
          event_type: "party_chat",
        })
        .expect(200);

      expect(mockPrisma.notifications.createMany).not.toHaveBeenCalled();
      expect(res.body).toEqual({ message: "no notification needed" });
    });

    it("returns 400 when note_id is missing for party event", async () => {
      const res = await request(app)
        .post("/api/noti")
        .send({
          sender_id: "user-A",
          event_type: "party_join",
        })
        .expect(400);

      expect(res.body).toEqual({
        error: "note_id จำเป็นสำหรับ party event",
      });
    });

    it("returns 400 when note not found for party event", async () => {
      mockPrisma.note.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .post("/api/noti")
        .send({
          sender_id: "user-A",
          note_id: 999,
          event_type: "party_chat",
        })
        .expect(400);

      expect(res.body).toEqual({
        error: "Note (note_id) ไม่พบ",
      });
    });
  });

  describe("POST /api/noti - comment/reply (note/blog)", () => {
    it("creates a notification for note owner when someone comments their note", async () => {
      mockPrisma.note.findUnique.mockResolvedValue({
        user_id: "user-B",
      });

      mockPrisma.notifications.create.mockResolvedValue({
        notification_id: 99,
      });

      const res = await request(app)
        .post("/api/noti")
        .send({
          sender_id: "user-A",
          note_id: 123,
          comment_id: 456,
        })
        .expect(200);

      expect(mockPrisma.note.findUnique).toHaveBeenCalledWith({
        where: { note_id: 123 },
        select: { user_id: true },
      });

      expect(mockPrisma.notifications.create).toHaveBeenCalledWith({
        data: {
          recipient_id: "user-B",
          sender_id: "user-A",
          note_id: 123,
          blog_id: null,
          comment_id: 456,
          parent_comment_id: null,
          type: "comment",
          is_read: false,
        },
        select: { notification_id: true },
      });

      expect(res.body).toEqual({
        message: "notification created",
        id: 99,
      });
    });

    it("does not create notification when sender comments their own note", async () => {
      mockPrisma.note.findUnique.mockResolvedValue({
        user_id: "user-A",
      });

      const res = await request(app)
        .post("/api/noti")
        .send({
          sender_id: "user-A",
          note_id: 123,
          comment_id: 456,
        })
        .expect(200);

      expect(mockPrisma.notifications.create).not.toHaveBeenCalled();
      expect(res.body).toEqual({ message: "no notification needed" });
    });

    it("returns 400 when note not found for note comment", async () => {
      mockPrisma.note.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .post("/api/noti")
        .send({
          sender_id: "user-A",
          note_id: 999,
          comment_id: 456,
        })
        .expect(400);

      expect(res.body).toEqual({
        error: "Note (note_id) ไม่พบ",
      });
      expect(mockPrisma.notifications.create).not.toHaveBeenCalled();
    });

    it("creates a notification for blog owner when someone comments their blog", async () => {
      mockPrisma.blog.findUnique.mockResolvedValue({
        user_id: "blog-owner",
      });

      mockPrisma.notifications.create.mockResolvedValue({
        notification_id: 50,
      });

      const res = await request(app)
        .post("/api/noti")
        .send({
          sender_id: "blog-commenter",
          blog_id: 10,
          comment_id: 301,
        })
        .expect(200);

      expect(mockPrisma.blog.findUnique).toHaveBeenCalledWith({
        where: { blog_id: 10 },
        select: { user_id: true },
      });

      expect(mockPrisma.notifications.create).toHaveBeenCalledWith({
        data: {
          recipient_id: "blog-owner",
          sender_id: "blog-commenter",
          note_id: null,
          blog_id: 10,
          comment_id: 301,
          parent_comment_id: null,
          type: "comment", 
          is_read: false,
        },
        select: { notification_id: true },
      });

      expect(res.body).toEqual({
        message: "notification created",
        id: 50,
      });
    });

    it("does not create notification when sender comments their own blog", async () => {
      mockPrisma.blog.findUnique.mockResolvedValue({
        user_id: "blog-owner",
      });

      const res = await request(app)
        .post("/api/noti")
        .send({
          sender_id: "blog-owner",
          blog_id: 10,
          comment_id: 301,
        })
        .expect(200);

      expect(mockPrisma.notifications.create).not.toHaveBeenCalled();
      expect(res.body).toEqual({ message: "no notification needed" });
    });

    it("returns 400 when blog not found for blog comment", async () => {
      mockPrisma.blog.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .post("/api/noti")
        .send({
          sender_id: "user-A",
          blog_id: 999,
          comment_id: 456,
        })
        .expect(400);

      expect(res.body).toEqual({
        error: "Blog (blog_id) ไม่พบ",
      });
      expect(mockPrisma.notifications.create).not.toHaveBeenCalled();
    });

    it("creates a notification for parent comment owner when someone replies to their note comment", async () => {
      mockPrisma.comment.findUnique.mockResolvedValue({
        user_id: "user-parent",
        blog_id: null,
        note_id: 123,
      });

      mockPrisma.notifications.create.mockResolvedValue({
        notification_id: 777,
      });

      const res = await request(app)
        .post("/api/noti")
        .send({
          sender_id: "user-replier",
          note_id: 123,
          comment_id: 456,          
          parent_comment_id: 111,   
        })
        .expect(200);

      expect(mockPrisma.comment.findUnique).toHaveBeenCalledWith({
        where: { comment_id: 111 },
        select: { user_id: true, blog_id: true, note_id: true },
      });

      expect(mockPrisma.notifications.create).toHaveBeenCalledWith({
        data: {
          recipient_id: "user-parent",
          sender_id: "user-replier",
          note_id: 123,
          blog_id: null,
          comment_id: 456,
          parent_comment_id: 111,
          type: "reply",
          is_read: false,
        },
        select: { notification_id: true },
      });

      expect(res.body).toEqual({
        message: "notification created",
        id: 777,
      });
    });

    it("creates a notification for parent comment owner when someone replies to their blog comment", async () => {
      mockPrisma.comment.findUnique.mockResolvedValue({
        user_id: "blog-comment-owner",
        blog_id: 10,
        note_id: null,
      });

      mockPrisma.notifications.create.mockResolvedValue({
        notification_id: 888,
      });

      const res = await request(app)
        .post("/api/noti")
        .send({
          sender_id: "blog-replier",
          blog_id: 10,
          comment_id: 402,          
          parent_comment_id: 210,   
        })
        .expect(200);

      expect(mockPrisma.comment.findUnique).toHaveBeenCalledWith({
        where: { comment_id: 210 },
        select: { user_id: true, blog_id: true, note_id: true },
      });

      expect(mockPrisma.notifications.create).toHaveBeenCalledWith({
        data: {
          recipient_id: "blog-comment-owner",
          sender_id: "blog-replier",
          note_id: null,
          blog_id: 10,
          comment_id: 402,
          parent_comment_id: 210,
          type: "reply",
          is_read: false,
        },
        select: { notification_id: true },
      });

      expect(res.body).toEqual({
        message: "notification created",
        id: 888,
      });
    });

    it("returns 400 when parent comment not found for reply", async () => {
      mockPrisma.comment.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .post("/api/noti")
        .send({
          sender_id: "user-replier",
          note_id: 123,
          comment_id: 456,
          parent_comment_id: 111,
        })
        .expect(400);

      expect(res.body).toEqual({
        error: "Parent comment (parent_comment_id) ไม่พบ",
      });
      expect(mockPrisma.notifications.create).not.toHaveBeenCalled();
    });

    it("returns 400 when comment_id is missing", async () => {
      const res = await request(app)
        .post("/api/noti")
        .send({
          sender_id: "user-A",
          note_id: 123,
        })
        .expect(400);

      expect(res.body).toEqual({ error: "comment_id จำเป็น" });
      expect(mockPrisma.notifications.create).not.toHaveBeenCalled();
    });

    it("returns 400 when neither note_id, blog_id nor parent_comment_id is provided", async () => {
      const res = await request(app)
        .post("/api/noti")
        .send({
          sender_id: "user-A",
          comment_id: 456,
        })
        .expect(400);

      expect(res.body).toEqual({
        error:
          "ต้องมีอย่างน้อยหนึ่ง: note_id หรือ blog_id หรือ parent_comment_id",
      });
      expect(mockPrisma.notifications.create).not.toHaveBeenCalled();
    });
  });

  describe("GET /api/noti/:userId", () => {
    it("returns mapped notifications belonging to the recipient", async () => {
      const now = new Date("2025-01-01T10:00:00Z");

      mockPrisma.notifications.findMany.mockResolvedValue([
        {
          notification_id: 1,
          recipient_id: "user-B",
          sender_id: "user-A",
          note_id: 3,
          blog_id: 10,
          comment_id: 4,
          parent_comment_id: 2,
          type: "reply",
          is_read: false,
          created_at: now,
          sender: {
            user_name: "Alice",
            img: "/avatars/a.png",
          },
        },
      ]);

      const res = await request(app)
        .get("/api/noti/user-B")
        .expect(200);

      expect(mockPrisma.notifications.findMany).toHaveBeenCalledWith({
        where: { recipient_id: "user-B" },
        orderBy: { created_at: "desc" },
        include: {
          sender: { select: { user_name: true, img: true } },
        },
      });

      expect(res.body).toEqual({
        notifications: [
          {
            notification_id: 1,
            sender_id: "user-A",
            sender_name: "Alice",
            sender_img: "/avatars/a.png",
            note_id: 3,
            blog_id: 10,
            comment_id: 4,
            parent_comment_id: 2,
            type: "reply",
            is_read: false,
            created_at: now.toISOString(),
          },
        ],
      });
    });

    it("returns 500 when fetching notifications fails", async () => {
      mockPrisma.notifications.findMany.mockRejectedValue(
        new Error("DB down")
      );

      const res = await request(app)
        .get("/api/noti/user-B")
        .expect(500);

      expect(res.body).toEqual({
        error: "โหลด noti ล้มเหลว",
      });
    });
  });

  describe("PUT /api/noti/:notificationId", () => {
    it("marks a notification as read", async () => {
      mockPrisma.notifications.update.mockResolvedValue({
        notification_id: 10,
        is_read: true,
      });

      const res = await request(app)
        .put("/api/noti/10")
        .send({})
        .expect(200);

      expect(mockPrisma.notifications.update).toHaveBeenCalledWith({
        where: { notification_id: 10 },
        data: { is_read: true },
      });

      expect(res.body).toEqual({
        message: "Notification marked as read",
      });
    });

    it("returns 500 when update fails", async () => {
      mockPrisma.notifications.update.mockRejectedValue(
        new Error("update fail")
      );

      const res = await request(app)
        .put("/api/noti/10")
        .send({})
        .expect(500);

      expect(res.body).toEqual({
        error: "Failed to mark notification as read",
      });
    });
  });
});
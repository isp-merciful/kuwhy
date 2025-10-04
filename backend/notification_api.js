const express = require("express");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const router = express.Router();


router.post("/", async (req, res) => {
  try {
    const { sender_id, note_id, blog_id, comment_id, parent_comment_id } = req.body;

    let recipientId = null;
    let type = "comment";

    if (parent_comment_id) {
      const parentComment = await prisma.comment.findUnique({
        where: { comment_id: parent_comment_id },
      });
      if (parentComment) {
        recipientId = parentComment.user_id;
        type = "reply";
      }
    }

    else if (note_id) {
      const note = await prisma.note.findUnique({ where: { note_id } });
      if (note) recipientId = note.user_id;
    }
 
    else if (blog_id) {
      const blog = await prisma.blog.findUnique({ where: { blog_id } });
      if (blog) recipientId = blog.user_id;
    }

  
    if (recipientId && recipientId !== sender_id) {
      const newNotification = await prisma.notifications.create({
        data: {
          recipient: { connect: { user_id: recipientId } },
          sender: { connect: { user_id: sender_id } },
          note: note_id ? { connect: { note_id } } : undefined,
          blog: blog_id ? { connect: { blog_id } } : undefined,
          comment: comment_id ? { connect: { comment_id } } : undefined,
          parent_comment: parent_comment_id
            ? { connect: { comment_id: parent_comment_id } }
            : undefined,
          type,
        },
      });

      res.json({ message: "notification created", id: newNotification.notification_id });
    } else {
      res.json({ message: "no notification needed" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message, message: "create notification fail" });
  }
});


router.get("/:userId", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);

    const notifications = await prisma.notifications.findMany({
      where: { recipient_id: userId },
      include: {
        sender: { select: { user_name: true, img: true, user_id: true } },
      },
      orderBy: { created_at: "desc" },
    });

    res.json({ notifications: notifications || [] });
  } catch (err) {
    console.error("❌ Error fetching notifications:", err);
    res.status(500).json({ error: "โหลด noti ล้มเหลว" });
  }
});


router.put("/:notificationId", async (req, res) => {
  try {
    const notificationId = parseInt(req.params.notificationId, 10);

    await prisma.notifications.update({
      where: { notification_id: notificationId },
      data: { is_read: true },
    });

    res.json({ message: "Notification marked as read" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
});

module.exports = router;

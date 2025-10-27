
const express = require("express");
const { prisma } = require('./lib/prisma.cjs');
const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { sender_id, note_id, blog_id, comment_id, parent_comment_id } = req.body;

    let recipientId = null;
    let type = "comment";


    if (parent_comment_id) {
      const parentComment = await prisma.comment.findUnique({
        where: { comment_id: parent_comment_id }
      });
      if (parentComment) {
        recipientId = parentComment.user_id;
        type = "reply";
      }
    }

    else if (note_id) {
      const note = await prisma.note.findUnique({
        where: { note_id: note_id }
      });
      if (note) {
        recipientId = note.user_id;
        type = "comment";
      }
    }

    else if (blog_id) {
      const blog = await prisma.blog.findUnique({
        where: { blog_id: blog_id }
      });
      if (blog) {
        recipientId = blog.user_id;
        type = "comment";
      }
    }


    if (recipientId && recipientId !== sender_id) {
      const notification = await prisma.notifications.create({
        data: {
          recipient_id: recipientId,
          sender_id: sender_id,
          note_id: note_id || null,
          blog_id: blog_id || null,
          comment_id: comment_id || null,
          parent_comment_id: parent_comment_id || null,
          type: type
        }
      });
      res.json({ message: "notification created", id: notification.notification_id });
    } else {
      res.json({ message: "no notification needed" });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message, message: 'create notification fail' });
  }
});


router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const notifications = await prisma.notifications.findMany({
      where: { recipient_id: userId },
      orderBy: { created_at: 'desc' },
      include: {
        sender: { select: { user_name: true, img: true } }, // ✅ ใช้ได้แล้ว
        // ถ้าต้องการข้อมูลอื่น เพิ่ม note/blog/comment relation ได้
        // note: true, blog: true
      }
    });

    const result = notifications.map(n => ({
      notification_id: n.notification_id,
      sender_id: n.sender_id,
      sender_name: n.sender?.user_name ?? 'Someone',
      sender_img: n.sender?.img ?? null,
      note_id: n.note_id,
      comment_id: n.comment_id,
      parent_comment_id: n.parent_comment_id,
      is_read: n.is_read,
      created_at: n.created_at
    }));

    res.json({ notifications: result });
  } catch (err) {
    console.error("❌ Error fetching notifications:", err);
    res.status(500).json({ error: "โหลด noti ล้มเหลว" });
  }
});

router.put("/:notificationId", async (req, res) => {
  try {
    const { notificationId } = req.params;
    await prisma.notifications.update({
      where: { notification_id: parseInt(notificationId) },
      data: { is_read: true }
    });
    res.json({ message: "Notification marked as read" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
});

module.exports = router;

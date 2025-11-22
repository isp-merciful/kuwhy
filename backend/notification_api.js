const express = require("express");
const { prisma } = require("./lib/prisma.cjs");
const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const {
      sender_id,
      note_id: noteRaw,
      blog_id: blogRaw,
      comment_id: commentRaw,
      parent_comment_id: parentRaw,
      event_type, 
    } = req.body;

    if (!sender_id) {
      return res.status(400).json({ error: "sender_id จำเป็น" });
    }

    const note_id =
      noteRaw !== undefined && noteRaw !== null ? Number(noteRaw) : null;
    const blog_id =
      blogRaw !== undefined && blogRaw !== null ? Number(blogRaw) : null;
    const parent_comment_id =
      parentRaw !== undefined && parentRaw !== null ? Number(parentRaw) : null;

    if (event_type === "party_join" || event_type === "party_chat") {
      if (!note_id) {
        return res
          .status(400)
          .json({ error: "note_id จำเป็นสำหรับ party event" });
      }

      const note = await prisma.note.findUnique({
        where: { note_id },
        select: { user_id: true },
      });
      if (!note) {
        return res.status(400).json({ error: "Note (note_id) ไม่พบ" });
      }

      const members = await prisma.party_members.findMany({
        where: { note_id },
        select: { user_id: true },
      });

      const recipients = new Set();
      recipients.add(note.user_id); 

      for (const m of members) {
        recipients.add(m.user_id);
      }

      recipients.delete(sender_id);

      if (recipients.size === 0) {
        return res.json({ message: "no notification needed" });
      }

      const rows = Array.from(recipients).map((recipient_id) => ({
        recipient_id,
        sender_id,
        note_id,
        blog_id: null,
        comment_id: null,
        parent_comment_id: null,
        type: event_type, 
        is_read: false,
      }));

      await prisma.notifications.createMany({ data: rows });

      return res.json({
        message: "party notifications created",
        count: rows.length,
      });
    }

    if (commentRaw == null) {
      return res.status(400).json({ error: "comment_id จำเป็น" });
    }
    const comment_id = Number(commentRaw);

    let recipientId = null;
    let type = "comment"; 

    if (parent_comment_id != null) {
      const parent = await prisma.comment.findUnique({
        where: { comment_id: parent_comment_id },
        select: { user_id: true, blog_id: true, note_id: true },
      });
      if (!parent) {
        return res
          .status(400)
          .json({ error: "Parent comment (parent_comment_id) ไม่พบ" });
      }
      recipientId = parent.user_id;
      type = "reply";
    } else if (note_id != null) {

      const note = await prisma.note.findUnique({
        where: { note_id },
        select: { user_id: true },
      });
      if (!note) {
        return res.status(400).json({ error: "Note (note_id) ไม่พบ" });
      }
      recipientId = note.user_id;
      type = "comment"; 
    } else if (blog_id != null) {
      const blog = await prisma.blog.findUnique({
        where: { blog_id },
        select: { user_id: true },
      });
      if (!blog) {
        return res.status(400).json({ error: "Blog (blog_id) ไม่พบ" });
      }
      recipientId = blog.user_id;
      type = "comment"; 
    } else {
      return res.status(400).json({
        error:
          "ต้องมีอย่างน้อยหนึ่ง: note_id หรือ blog_id หรือ parent_comment_id",
      });
    }

    if (!recipientId || recipientId === sender_id) {
      return res.json({ message: "no notification needed" });
    }

    const notification = await prisma.notifications.create({
      data: {
        recipient_id: recipientId,
        sender_id,
        note_id,
        blog_id,
        comment_id,
        parent_comment_id,
        type, 
        is_read: false,
      },
      select: { notification_id: true },
    });

    return res.json({
      message: "notification created",
      id: notification.notification_id,
    });
  } catch (error) {
    if (error.code === "P2003" || error.code === "P2025") {
      return res
        .status(400)
        .json({ error: "FK not found (note/blog/comment/users)" });
    }
    console.error("❌ /api/noti error:", error);
    res.status(500).json({ error: "create notification fail" });
  }
});

router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const notifications = await prisma.notifications.findMany({
      where: { recipient_id: userId },
      orderBy: { created_at: "desc" },
      include: {
        sender: { select: { user_name: true, img: true } },
      },
    });

    const result = notifications.map((n) => ({
      notification_id: n.notification_id,
      sender_id: n.sender_id,
      sender_name: n.sender?.user_name ?? "Someone",
      sender_img: n.sender?.img ?? null,
      note_id: n.note_id,
      blog_id: n.blog_id,
      comment_id: n.comment_id,
      parent_comment_id: n.parent_comment_id,
      type: n.type,
      is_read: n.is_read,
      created_at: n.created_at,
    }));

    res.json({ notifications: result });
  } catch (err) {
    console.error("❌ Error fetching notifications:", err);
    res.status(500).json({ error: "โหลด noti ล้มเหลว" });
  }
});

router.put("/:notificationId", async (req, res) => {
  try {
    const notificationId = Number(req.params.notificationId);
    await prisma.notifications.update({
      where: { notification_id: notificationId },
      data: { is_read: true },
    });
    res.json({ message: "Notification marked as read" });
  } catch (err) {
    console.error("❌ mark read error:", err);
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
});

module.exports = router;

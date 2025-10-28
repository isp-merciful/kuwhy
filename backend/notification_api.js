// notification_api.js
const express = require("express");
const { prisma } = require("./lib/prisma.cjs");
const router = express.Router();

/* ---------------- helpers ---------------- */
const toIntOrNull = (v) =>
  v === undefined || v === null || v === "" ? null : Number.parseInt(v, 10);

const toStrOrNull = (v) =>
  v === undefined || v === null || v === "" ? null : String(v);

/**
 * POST /api/noti
 * body: { sender_id, note_id?, blog_id?, comment_id?, parent_comment_id? }
 */
router.post("/", async (req, res) => {
  try {
    const { sender_id, note_id, blog_id, comment_id, parent_comment_id } = req.body;

    // 1) หา recipient จาก parent comment / note / blog
    let recipientId = null;
    let type = "comment";

    if (parent_comment_id) {
      const parent = await prisma.comment.findUnique({
        where: { comment_id: toIntOrNull(parent_comment_id) },
        select: { user_id: true },
      });
      if (parent) { recipientId = parent.user_id; type = "reply"; }
    } else if (note_id) {
      const note = await prisma.note.findUnique({
        where: { note_id: toIntOrNull(note_id) },
        select: { user_id: true },
      });
      if (note) recipientId = note.user_id;
    } else if (blog_id) {
      const blog = await prisma.blog.findUnique({
        where: { blog_id: toIntOrNull(blog_id) },
        select: { user_id: true },
      });
      if (blog) recipientId = blog.user_id;
    }

    // 2) กันไม่แจ้งเตือนตัวเอง + validate ชนิด
    const senderStr = toStrOrNull(sender_id);      // UUID string
    const recipientStr = toStrOrNull(recipientId); // UUID string

    if (!recipientStr || !senderStr) {
      return res.status(400).json({ error: "sender/recipient ไม่ครบหรือชนิดไม่ถูก" });
    }
    if (recipientStr === senderStr) {
      return res.json({ message: "no notification needed" });
    }

    // 3) create notification
    const data = {
      recipient_id: recipientStr,        // String (UUID)
      sender_id: senderStr,              // String (UUID)
      note_id: toIntOrNull(note_id),
      blog_id: toIntOrNull(blog_id),
      parent_comment_id: toIntOrNull(parent_comment_id),
      type,
    };

    // ถ้า schema ของคุณ “บังคับ” ให้เชื่อม comment ผ่าน relation (required)
    // ให้ใช้ connect ที่ชื่อตาม schema ของคุณ (จาก error เดิมชื่อยาว ๆ ประมาณ comment_notifications_comment_idTocomment)
    if (comment_id) {
      data.comment_notifications_comment_idTocomment = {
        connect: { comment_id: toIntOrNull(comment_id) },
      };
    }

    const created = await prisma.notifications.create({
      data,
      select: { notification_id: true },
    });

    res.json({ message: "notification created", id: created.notification_id });
  } catch (error) {
    console.error("❌ create notification fail:", error);
    res.status(500).json({ error: error.message, message: "create notification fail" });
  }
});

/**
 * GET /api/noti/:userId?is_read=false&limit=30
 * ดึง noti ของผู้รับ (ใหม่→เก่า) + แปะ sender_name
 */
router.get("/:userId", async (req, res) => {
  try {
    // สำคัญ: recipient_id เป็น String (UUID) → ห้าม Number()
    const userId = toStrOrNull(req.params.userId);

    // ตัวกรองเสริม
    const is_read = req.query.is_read;
    const limit =
      req.query.limit !== undefined ? Math.max(1, Math.min(100, Number(req.query.limit))) : 50;

    const where = { recipient_id: userId };
    if (is_read === "true") where.is_read = true;
    if (is_read === "false") where.is_read = false;

    const notis = await prisma.notifications.findMany({
      where,
      orderBy: { created_at: "desc" },
      take: limit,
      select: {
        notification_id: true,
        sender_id: true,
        note_id: true,
        // หมายเหตุ: ถ้า schema คุณ "ไม่ได้" มีคอลัมน์ comment_id ในตาราง notifications
        // อย่า select ตรง ๆ ให้ดึงผ่าน relation แทน
        comment_id: true,            // <-- ถ้าไม่มีฟิลด์นี้ในตารางจริง ให้ลบทิ้ง
        parent_comment_id: true,
        is_read: true,
        created_at: true,
      },
    });

    // map sender_name
    const senderIds = [...new Set(notis.map((n) => n.sender_id))].filter(Boolean);
    let senderMap = {};
    if (senderIds.length > 0) {
      const senders = await prisma.users.findMany({
        where: { user_id: { in: senderIds } },
        select: { user_id: true, user_name: true },
      });
      senderMap = Object.fromEntries(senders.map((u) => [u.user_id, u.user_name]));
    }

    const rows = notis.map((n) => ({
      notification_id: n.notification_id,
      sender_id: n.sender_id,
      sender_name: senderMap[n.sender_id] ?? null,
      note_id: n.note_id,
      comment_id: n.comment_id ?? null, // ถ้าไม่มีคอลัมน์จริง ให้คืน null
      parent_comment_id: n.parent_comment_id,
      is_read: n.is_read,
      created_at: n.created_at,
    }));

    res.json({ notifications: rows });
  } catch (err) {
    console.error("❌ Error fetching notifications:", err);
    res.status(500).json({ error: "โหลด noti ล้มเหลว" });
  }
});

/**
 * PUT /api/noti/:notificationId
 * mark read = true
 */
router.put("/:notificationId", async (req, res) => {
  try {
    const notificationId = toIntOrNull(req.params.notificationId);
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

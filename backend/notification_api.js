const express = require('express');
const router = express.Router();

let wire = null;

function DBconnect(val){
    wire = val;
}

router.post('/', async (req, res) => {
  try {
    const { sender_id, note_id, blog_id, comment_id, parent_comment_id } = req.body;

    let recipientId = null;
    let type = "comment";

    // case: reply comment
    if (parent_comment_id) {
      const [rows] = await wire.query(
        "SELECT user_id FROM comment WHERE comment_id = ?",
        [parent_comment_id]
      );
      if (rows.length > 0) {
        recipientId = rows[0].user_id;
        type = "reply";
      }
    }
    // case: comment ใน note
    else if (note_id) {
      const [rows] = await wire.query(
        "SELECT user_id FROM note WHERE note_id = ?",
        [note_id]
      );
      if (rows.length > 0) {
        recipientId = rows[0].user_id;
        type = "comment";
      }
    }
    // case: comment ใน blog
    else if (blog_id) {
      const [rows] = await wire.query(
        "SELECT user_id FROM blog WHERE blog_id = ?",
        [blog_id]
      );
      if (rows.length > 0) {
        recipientId = rows[0].user_id;
        type = "comment";
      }
    }

    // ไม่แจ้งเตือนตัวเอง
    if (recipientId && recipientId !== sender_id) {
      const [result] = await wire.query(
        `INSERT INTO notifications 
         (recipient_id, sender_id, note_id, blog_id, comment_id, parent_comment_id, type) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          recipientId,
          sender_id,
          note_id || null,
          blog_id || null,
          comment_id || null,
          parent_comment_id || null,
          type
        ]
      );

      res.json({ message: "notification created", id: result.insertId });
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

    const [rows] = await wire.query(
      `SELECT n.notification_id, n.sender_id, u.user_name AS sender_name, 
              n.note_id, n.comment_id, n.parent_comment_id, 
              n.is_read, n.created_at
      FROM notifications n
      JOIN users u ON n.sender_id = u.user_id
      WHERE n.recipient_id = ?
      ORDER BY n.created_at DESC`,
      [userId]
    );

    res.json({ notifications: rows ||[] });
  } catch (err) {
    console.error("❌ Error fetching notifications:", err);
    res.status(500).json({ error: "โหลด noti ล้มเหลว" });
  }
});

router.put("/:notificationId", async (req, res) => {
  try {
    const { notificationId } = req.params;
    await wire.query(
      "UPDATE notifications SET is_read = TRUE WHERE notification_id = ?",
      [notificationId]
    );
    res.json({ message: "Notification marked as read" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
});


module.exports = { router, DBconnect };
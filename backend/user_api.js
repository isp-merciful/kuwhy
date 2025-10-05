const express = require('express');
const router = express.Router();

let wire = null;

function DBconnect(val){
    wire = val;
}

router.post('/', async (req, res) => {
  try {
    const { user_id, user_name } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: "Missing user_id" });
    }

    const [existing] = await wire.query(
      "SELECT * FROM users WHERE user_id = ?",
      [user_id]
    );

    if (existing.length > 0) {
      return res.json({
        message: "User already exists",
        user: existing[0]
      });
    }

    const gender = "Not Specified";
    const img = "/images/pfp.png";

    await wire.query(
      "INSERT INTO users (user_id, user_name, gender, img) VALUES (?, ?, ?, ?)",
      [user_id, user_name || "anonymous", gender, img]
    );

    res.json({
      message: "User registered successfully",
      user_id,
      user_name: user_name || "anonymous",
      gender,
      img
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database insert failed" });
  }
});

router.get('/', async(req,res) =>{
    try{
        let result = await wire.query('SELECT * from users'
        )
        res.json(result[0])
    }catch(error) {
        console.error(error);
        res.status(500).json({error : 'fetch user fail'});
    }
});


router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await wire.query(
      'SELECT * FROM users WHERE user_id = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

router.put('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { name } = req.body;

    if (!name || !userId) {
      return res.status(400).json({ error: "Missing name or userId" });
    }

    const [result] = await wire.query(
      "UPDATE users SET user_name = ? WHERE user_id = ?",
      [name, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "Name updated successfully", user_name: name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update user name" });
  }
});

router.delete('/:id', async(req,res) => {
    try{
      const [result] = await wire.query(
        'delete from users where user_id = ?',[req.params.id]
      )
    res.json('delete success');
    }catch(error){
        console.error(error);
        res.status(500).json({
            error:"can't deleted "
        })
    }
});

router.post('/merge', async (req, res) => {
  try {
    const { user_id, anonymous_id, user_name, email, image, role } = req.body;

    if (!user_id || !anonymous_id) {
      return res.status(400).json({ error: "Missing user_id or anonymous_id" });
    }

    // ใช้ INSERT ... ON DUPLICATE KEY UPDATE
    await wire.query(
      `
      INSERT INTO users (user_id, user_name, email, img, role)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        user_name = VALUES(user_name),
        img = VALUES(img),
        role = VALUES(role)
      `,
      [user_id, user_name, email, image, role]
    );

    // optional: ลบ anonymous user หลัง merge
    await wire.query(
      "DELETE FROM users WHERE user_id = ? AND user_id != ?",
      [anonymous_id, user_id]
    );

    res.json({ message: "User merged successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Merge failed" });
  }
});

module.exports = { router, DBconnect };
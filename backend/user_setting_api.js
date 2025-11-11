// user_setting_api.js
const express = require("express");
const router = express.Router();
const { prisma } = require('./lib/prisma.cjs');

router.put('/:id', async (req, res) => {
  try {
    const userId = req.params.id; // <<— มาจาก requireMember
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    console.log("[user-setting] update id =", userId);
    console.log("[user-setting] body =", req.body);



    const { full_name,display_name, email, bio, location, website, phone } = req.body;

    const updates = {};
    if (full_name !== undefined) updates.full_name = full_name;
    if (display_name !== undefined) updates.user_name = display_name;
    if (email !== undefined) updates.email = email;
    if (bio !== undefined) updates.bio = bio;
    if (location !== undefined) updates.location = location;
    if (phone !== undefined) updates.phone = phone;
    if (website !== undefined) updates.web = website; // <<— field ใน prisma คือ 'web'

    // if (!Object.keys(updates).length) {
    //   return res.status(400).json({ error: "No fields provided for update" });
    // }

    const updatedUser = await prisma.users.update({
      where: { user_id: userId },
      data: updates,
    });

    res.json({
      message: "User settings updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: "User not found" });
    if (err.code === 'P2002') return res.status(409).json({ error: `Duplicate: ${err.meta?.target?.join(', ')}` });
    console.error(err);
    res.status(500).json({ error: "Failed to update user settings" });
  }
});

module.exports = router;

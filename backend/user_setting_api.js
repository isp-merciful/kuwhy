// user_setting_api.js
const express = require("express");
const router = express.Router();
const { prisma } = require('./lib/prisma.cjs');

router.put('/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    console.log("[user-setting] update id =", userId);
    console.log("[user-setting] body =", req.body);

    const {
      full_name,
      display_name,
      email,
      bio,
      location,
      website,
      phone,
      img        // ADD this so we can update image
    } = req.body;

    const updates = {};

    // ----- Custom users table fields -----
    if (full_name !== undefined) updates.full_name = full_name;
    if (display_name !== undefined) updates.user_name = display_name;
    if (email !== undefined) updates.email = email;
    if (bio !== undefined) updates.bio = bio;
    if (location !== undefined) updates.location = location;
    if (phone !== undefined) updates.phone = phone;
    if (website !== undefined) updates.web = website;

    // ⭐ IMPORTANT: update your custom image column
    if (img !== undefined && img.trim() !== "") {
      updates.img = img;
    }

    // ----- UPDATE your custom users table -----
    const updatedUser = await prisma.users.update({
      where: { user_id: userId },
      data: updates,
    });

    // ⭐ FIX: ALSO update the NextAuth user table
    // This controls session.user.image and Navbar avatar
    if (img !== undefined && img.trim() !== "") {
      await prisma.user.update({
        where: { id: userId },
        data: { image: img }
      });
    }

    res.json({
      message: "User settings updated successfully",
      user: updatedUser,
    });

  } catch (err) {
    if (err.code === 'P2025')
      return res.status(404).json({ error: "User not found" });
    if (err.code === 'P2002')
      return res.status(409).json({ error: `Duplicate: ${err.meta?.target?.join(', ')}` });

    console.error(err);
    res.status(500).json({ error: "Failed to update user settings" });
  }
});

module.exports = router;

const express = require("express");
const router = express.Router({ mergeParams: true });
const { prisma } = require('./lib/prisma.cjs');

router.put('/', async (req, res) => {
  try {
    const { id: userId } = req.params;
    const { full_name, email, bio, location, website, phone } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    const updates = {};
    if (full_name !== undefined) updates.full_name = full_name;
    if (email !== undefined) updates.email = email;
    if (bio !== undefined) updates.bio = bio;
    if (location !== undefined) updates.location = location;
    if (website !== undefined) updates.website = website;
    if (phone !== undefined) updates.phone = phone;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No fields provided for update" });
    }

    const updatedUser = await prisma.users.update({
      where: { user_id: userId },
      data: updates,
    });

    res.json({
      message: "User settings updated successfully",
      user: updatedUser,
    });

  } catch (err) {
    if (err.code === 'P2025') { // Prisma error: record not found
      return res.status(404).json({ error: "User not found" });
    }

    console.error(err);
    res.status(500).json({ error: "Failed to update user settings" });
  }
});

module.exports = router;

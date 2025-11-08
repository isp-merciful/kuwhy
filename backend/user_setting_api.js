const express = require("express");
const router = express.Router();
const { prisma } = require('./lib/prisma.cjs');


router.put('/:userId/setting', async (req, res) => {
  try {
    const { userId } = req.params;
    const { full_name,email,bio,location,website,phone } = req.body;





    if (!userId) {
      return res.status(400).json({ error: "Missing name or userId" });
    }

    const updates = {};

    if (req.body.full_name !== undefined) updates.full_name = req.body.full_name;
    if (req.body.email !== undefined) updates.email = req.body.email;
    if (req.body.bio !== undefined) updates.bio = req.body.bio;
    if (req.body.location !== undefined) updates.location = req.body.location;
    if (req.body.website !== undefined) updates.website = req.body.website;
    if (req.body.phone !== undefined) updates.phone = req.body.phone;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updates,
    });

    res.json({ message: "Name updated successfully", user_name: updatedUser.user_name });
  } catch (err) {
    if (err.code === 'P2025') { // Prisma error: record not found
      return res.status(404).json({ error: "User not found" });
    }

    console.error(err);
    res.status(500).json({ error: "Failed to update user name" });
  }
});




module.exports = router;
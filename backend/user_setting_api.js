// user_setting_api.js
const express = require("express");
const router = express.Router();
const { prisma } = require("./lib/prisma.cjs");
const fs = require("fs");
const path = require("path");

/**
 * Helper: save base64 data URL to /uploads and return a short path
 *   e.g. "/uploads/pfp_<userId>_<timestamp>.png"
 */
async function saveBase64Image(userId, dataUrl) {
  if (typeof dataUrl !== "string") return null;

  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) {
    console.warn("[user-setting] invalid data URL");
    return null;
  }

  const mime = match[1]; // e.g. "image/png"
  const base64 = match[2];
  const ext = (mime.split("/")[1] || "png").toLowerCase(); // "png", "jpeg", ...

  const buffer = Buffer.from(base64, "base64");

  const uploadsDir = path.join(process.cwd(), "uploads");
  await fs.promises.mkdir(uploadsDir, { recursive: true });

  const fileName = `pfp_${userId}_${Date.now()}.${ext}`;
  const filePath = path.join(uploadsDir, fileName);

  await fs.promises.writeFile(filePath, buffer);

  // this is what the frontend will use, served by express.static("/uploads", ...)
  const publicPath = `/uploads/${fileName}`;
  return publicPath;
}

router.put("/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    console.log("[user-setting] update id =", userId);
    console.log("[user-setting] body keys =", Object.keys(req.body || {}));

    const {
      full_name,
      display_name,
      email,
      bio,
      location,
      website,
      phone,
      img, // may be data URL or a normal URL
    } = req.body || {};

    const updates = {};

    // ----- Custom users table fields -----
    if (full_name !== undefined) updates.full_name = full_name;
    if (display_name !== undefined) updates.user_name = display_name;
    if (email !== undefined) updates.email = email;
    if (bio !== undefined) updates.bio = bio;
    if (location !== undefined) updates.location = location;
    if (phone !== undefined) updates.phone = phone;
    if (website !== undefined) updates.web = website;

    let finalImg = null;

    if (typeof img === "string" && img.trim() !== "") {
      const trimmed = img.trim();

      // ⭐ if it is a base64 data URL, save to /uploads and use short path
      if (trimmed.startsWith("data:image/")) {
        try {
          const savedPath = await saveBase64Image(userId, trimmed);
          if (savedPath) {
            finalImg = savedPath; // "/uploads/xxx.png"
          }
        } catch (e) {
          console.error("[user-setting] failed to save avatar file:", e);
          return res
            .status(500)
            .json({ error: "Failed to save profile image" });
        }
      } else {
        // already a short URL/path; just use it directly
        finalImg = trimmed;
      }

      if (finalImg) {
        updates.img = finalImg;
      }
    }

    // ----- UPDATE your custom users table -----
    const updatedUser = await prisma.users.update({
      where: { user_id: userId },
      data: updates,
    });

    // ⭐ ALSO update NextAuth User.image if we have a new image path
    if (finalImg) {
      try {
        await prisma.user.update({
          where: { id: userId },
          data: { image: finalImg },
        });
      } catch (e) {
        // If there's no NextAuth user row, don't fail the request; just log.
        if (e.code === "P2025") {
          console.warn("[user-setting] NextAuth user not found for", userId);
        } else {
          console.error("[user-setting] failed to update NextAuth user.image:", e);
        }
      }
    }

    return res.json({
      message: "User settings updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    if (err.code === "P2025")
      return res.status(404).json({ error: "User not found" });
    if (err.code === "P2002")
      return res
        .status(409)
        .json({ error: `Duplicate: ${err.meta?.target?.join(", ")}` });

    console.error("[user-setting] unexpected error:", err);
    res.status(500).json({ error: "Failed to update user settings" });
  }
});

module.exports = router;

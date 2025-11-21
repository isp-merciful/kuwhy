const express = require("express");
const router = express.Router();
const { prisma } = require("./lib/prisma.cjs");
const fs = require("fs");
const path = require("path");

async function saveBase64Image(userId, dataUrl) {
  if (typeof dataUrl !== "string") return null;

  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) {
    console.warn("[user-setting] invalid data URL");
    return null;
  }

  const mime = match[1]; 
  const base64 = match[2];
  const ext = (mime.split("/")[1] || "png").toLowerCase(); 

  const buffer = Buffer.from(base64, "base64");

   const uploadsDir = path.join(process.cwd(), "uploads");
  await fs.promises.mkdir(uploadsDir, { recursive: true });

  const fileName = `pfp_${userId}_${Date.now()}.${ext}`;
  const filePath = path.join(uploadsDir, fileName);

  await fs.promises.writeFile(filePath, buffer);

  const publicPath = `/uploads/${fileName}`;

  const BASE =
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.BACKEND_URL ||
    "http://localhost:8000";

  const fullUrl =
    publicPath.startsWith("http://") || publicPath.startsWith("https://")
      ? publicPath
      : `${BASE}${publicPath}`;

  return fullUrl;
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
      img,
    } = req.body || {};

    const updates = {};

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

      if (trimmed.startsWith("data:image/")) {
        try {
          const savedPath = await saveBase64Image(userId, trimmed);
          if (savedPath) {
            finalImg = savedPath; 
          }
        } catch (e) {
          console.error("[user-setting] failed to save avatar file:", e);
          return res
            .status(500)
            .json({ error: "Failed to save profile image" });
        }
      } else {
        finalImg = trimmed;
      }

      if (finalImg) {
        updates.img = finalImg;
      }
    }

    const updatedUser = await prisma.users.update({
      where: { user_id: userId },
      data: updates,
    });

    if (finalImg) {
      try {
        await prisma.user.update({
          where: { id: userId },
          data: { image: finalImg },
        });
      } catch (e) {
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

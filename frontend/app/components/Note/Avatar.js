// Avatar.jsx
"use client";
import { useMemo, useRef, useEffect } from "react";

export default function Avatar({
  center = true,
  size = 150,
  style = "random",
  seed,
  className = "",
  onUrlReady,
  src,                 // ✅ ถ้ามี src จะใช้รูปนี้เลย (ไม่สุ่ม)
}) {
  const chosenStyle = useMemo(() => {
    if (style !== "random") return style;
    const arr = ["thumbs", "Dylan"];
    return arr[Math.floor(Math.random() * arr.length)];
  }, [style]);

  const seedRef = useRef(seed || (typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : String(Math.random())));

  const build = ({ style, seed, size = 150, png = true }) => {
    const fmt = png ? "png" : "svg";
    const params = new URLSearchParams({
      seed,
      size: String(size),
      radius: "50",
      backgroundType: "gradientLinear",
    });
    return `https://api.dicebear.com/9.x/${style}/${fmt}?${params.toString()}`;
  };

  const url = useMemo(
    () => src || build({ style: chosenStyle, seed: seedRef.current, size, png: true }),
    [src, chosenStyle, size]
  );

  useEffect(() => {
    if (!src && onUrlReady) onUrlReady(url); // แจ้งเฉพาะตอนเป็นรูปสุ่ม
  }, [url, src, onUrlReady]);

  return (
    <div className={`${center ? "mt-1 flex justify-center w-full" : "mt-1"} ${className}`}>
      <img
        src={url}
        alt="avatar"
        width={size}
        height={size}
        className="rounded-full object-cover border border-gray-300 bg-gray-100"
        onError={(e) => {
          if (src) return; // ถ้าเป็นรูปล็อกจาก DB ไม่เปลี่ยน style สำรอง (ให้ owner แก้เอง)
          e.currentTarget.src = build({ style: "thumbs", seed: seedRef.current, size, png: true });
        }}
      />
    </div>
  );
}

"use client";
import { useMemo, useRef } from "react";

const DICEBEAR_STYLES = [
  "thumbs",        
  "adventurer",    

];

function buildDicebearUrl({ style, seed, size = 150, png = true }) {
  const fmt = png ? "png" : "svg";
  const params = new URLSearchParams({
    seed,
    size: String(size),
    radius: "50",                     // มุมโค้ง
    backgroundType: "gradientLinear", // มีพื้นหลังสวยๆ
  });
  return `https://api.dicebear.com/9.x/${style}/${fmt}?${params.toString()}`;
}

export default function Avatar({
  center = true,
  size = 150,
  style = "random",     // "thumbs" | "adventurer" | ... | "random"
  seed,                 // ถ้าไม่ส่งมา จะสุ่มให้
  className = "",
}) {
  // เลือก style แบบคงที่ต่อ component (ไม่เปลี่ยนทุก re-render)
  const chosenStyle = useMemo(() => {
    if (style !== "random") return style;
    const i = Math.floor(Math.random() * DICEBEAR_STYLES.length);
    return DICEBEAR_STYLES[i];
  }, [style]);

  // ทำ seed ครั้งเดียวต่อ component
  const seedRef = useRef(seed || (typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : String(Math.random())));

  const url = useMemo(
    () => buildDicebearUrl({ style: chosenStyle, seed: seedRef.current, size, png: true }),
    [chosenStyle, size]
  );

  return (
    <div className={`${center ? "mt-1 flex justify-center w-full" : "mt-1"} ${className}`}>
      <img
        src={url}
        alt="avatar"
        width={size}
        height={size}
        className="rounded-full object-cover border border-gray-300 bg-gray-100"
        onError={(e) => {
          // ถ้าสตรีมล่ม ลองสลับไป style สำรอง
          const fallback = buildDicebearUrl({
            style: "identicon",
            seed: seedRef.current,
            size,
            png: true,
          });
          e.currentTarget.src = fallback;
        }}
      />
    </div>
  );
}

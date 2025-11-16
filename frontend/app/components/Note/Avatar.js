"use client";
import { useMemo, useRef, useEffect } from "react";

const normalizeStyle = (s) => String(s || "").trim().toLowerCase();

export default function Avatar({
  center = true,
  size = 150,
  style = "random",
  seed,
  className = "",
  onUrlReady,
  src, // ถ้ามี = ใช้รูปจาก DB โดยตรง (ถือว่า cache แล้ว)
}) {
  const chosenStyle = useMemo(() => {
    if (style !== "random") return normalizeStyle(style);
    const arr = ["thumbs", "dylan"];
    return arr[Math.floor(Math.random() * arr.length)];
  }, [style]);

  const seedRef = useRef(
    seed ||
      (typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : String(Math.random()))
  );

  const build = ({ style, seed, size = 150, png = true }) => {
    const fmt = png ? "png" : "svg";
    const params = new URLSearchParams({
      seed,
      size: String(size),
      radius: "50",
      backgroundType: "gradientLinear",
    });
    const slug = normalizeStyle(style);
    return `https://api.dicebear.com/9.x/${slug}/${fmt}?${params.toString()}`;
  };

  // url ที่จะใช้จริงบน <img>
  const url = useMemo(
    () => src || build({ style: chosenStyle, seed: seedRef.current, size, png: true }),
    [src, chosenStyle, size]
  );

  // ✅ lazy cache: เรียก onUrlReady แค่ "ครั้งแรกที่ไม่มี src"
  const emittedRef = useRef(false);

  useEffect(() => {
    // มี src แล้ว = เราใช้ค่าจาก DB อยู่ → ไม่ต้อง emit อะไร
    if (src) return;
    if (!onUrlReady) return;

    // เคยส่งไปแล้ว → ไม่ต้องส่งซ้ำ
    if (emittedRef.current) return;

    emittedRef.current = true;
    onUrlReady(url);
  }, [url, src, onUrlReady]);

  // ถ้าในอนาคตเคลียร์ src ทิ้ง แล้วอยากให้ gen ใหม่ → reset flag
  useEffect(() => {
    if (src) {
      emittedRef.current = false;
    }
  }, [src]);

  return (
    <div
      className={`${center ? "mt-1 flex justify-center w-full" : "mt-1"} ${
        className || ""
      }`}
    >
      <img
        src={url}
        alt="avatar"
        width={size}
        height={size}
        loading="lazy"
        className="rounded-full object-cover border border-gray-300 bg-gray-100"
        onError={(e) => {
          // ถ้า src มาจาก DB แล้วพัง → ไม่พยายาม gen ใหม่ (ปล่อยให้ parent จัดการ)
          if (src) return;
          // เคส dicebear พัง → fallback เป็น style thumbs ด้วย seed เดิม
          e.currentTarget.src = build({
            style: "thumbs",
            seed: seedRef.current,
            size,
            png: true,
          });
        }}
      />
    </div>
  );
}

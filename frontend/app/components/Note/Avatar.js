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
  src,
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

  const url = useMemo(
    () => src || build({ style: chosenStyle, seed: seedRef.current, size, png: true }),
    [src, chosenStyle, size]
  );

  useEffect(() => {
    if (!src && onUrlReady) onUrlReady(url);
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
          if (src) return;
          e.currentTarget.src = build({ style: "thumbs", seed: seedRef.current, size, png: true });
        }}
      />
    </div>
  );
}
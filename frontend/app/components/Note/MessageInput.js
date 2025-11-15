// frontend/app/components/Note/MessageInput.js
"use client";

import { useEffect, useRef } from "react";

export default function MessageInput({
  text,
  setText,
  isPosted,
  isCompose = false,      // true เฉพาะตอนอยู่หน้า compose view
  handlePost,            // ยังรับไว้เผื่อใช้ต่อ แต่ไม่ใช้ใน component นี้แล้ว
  loading,
  setShowPopup,
  variant = "default",
  onBubbleClick,
}) {
  const textareaRef = useRef(null);

  // auto-resize textarea เฉพาะตอนมี textarea อยู่ (ยังไม่โพสต์)
  useEffect(() => {
    if (!textareaRef.current) return;
    if (isPosted) return;

    const el = textareaRef.current;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [text, isPosted]); // 👈 deps คงที่ ไม่มี error final argument แล้ว

  const composeMode = !isPosted && (isCompose || variant === "compose");

  const bubbleBg =
    isPosted ? "bg-green-100" : composeMode ? "bg-[#2FA2FF]" : "bg-white";

  const textColor =
    isPosted || !composeMode
      ? "text-gray-800 placeholder-gray-400"
      : "text-white placeholder-white/90";

  const handleClickBubble = () => {
    if (onBubbleClick) onBubbleClick();
  };

  return (
    <div className="relative flex justify-center">
      {/* ตัว bubble */}
      <div
        onClick={handleClickBubble}
        className={`
          relative inline-block
          max-w-[260px] w-full
          min-h-[60px]
          rounded-3xl px-5 py-3 shadow-md
          flex items-center
          ${bubbleBg}
        `}
        style={{ textWrap: "pretty" }}
      >
        {isPosted ? (
          <p
            className="
              w-full text-sm font-semibold leading-snug
              whitespace-pre-wrap break-words
              text-gray-800
            "
            style={{ textWrap: "pretty" }}
          >
            {text || "—"}
          </p>
        ) : (
          <textarea
            ref={textareaRef}
            rows={1}
            placeholder="Share a note"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className={`
              w-full text-sm border-none resize-none
              focus:outline-none bg-transparent overflow-hidden
              ${textColor}
            `}
          />
        )}

        {/* หาง bubble (ใช้ตำแหน่งเดียวกันทั้งโพสต์/ไม่โพสต์) */}
        <span
          aria-hidden
          className={`
            pointer-events-none
            absolute -bottom-2 left-1/2 -translate-x-1/2 -translate-x-5
            w-3 h-3 rounded-full
            ${bubbleBg}
          `}
        />
        <span
          aria-hidden
          className={`
            pointer-events-none
            absolute -bottom-[1.125rem] left-1/2 -translate-x-1/2 -translate-x-3
            w-2 h-2 rounded-full
            ${bubbleBg}
          `}
        />
      </div>
    </div>
  );
}

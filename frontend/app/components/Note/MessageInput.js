"use client";

import { useEffect, useRef, useState } from "react";

const PLACEHOLDERS = [
  "Share a note",
  "Current mood?",
  "Random thought..",
  "Quick update?",
  "Recently into..",
];

export default function MessageInput({
  text,
  setText,
  isPosted,
  isCompose = false,
  handlePost, 
  loading,
  setShowPopup,
  variant = "default",
  onBubbleClick,
}) {
  const textareaRef = useRef(null);

  const [placeholder, setPlaceholder] = useState(PLACEHOLDERS[0]);

  useEffect(() => {
    if (!textareaRef.current) return;
    if (isPosted) return;

    const el = textareaRef.current;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [text, isPosted]);

  useEffect(() => {
    if (isPosted) return;
    if (text && text.trim().length > 0) return;

    const idx = Math.floor(Math.random() * PLACEHOLDERS.length);
    setPlaceholder(PLACEHOLDERS[idx]);
  }, [isPosted, text]);

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
            placeholder={placeholder} 
            value={text}
            onChange={(e) => setText(e.target.value)}
            className={`
              w-full text-sm border-none resize-none
              focus:outline-none bg-transparent overflow-hidden
              ${textColor}
            `}
          />
        )}

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

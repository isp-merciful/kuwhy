"use client";
import { useEffect, useRef, useState } from "react";

export default function MessageInput({
  text,
  setText,
  isPosted,
  handlePost,
  loading,
  setShowPopup,
  variant = "default", // "default" | "compose"
  showButton = true,
  onBubbleClick,
}) {
  const textareaRef = useRef(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      setHeight(textareaRef.current.scrollHeight);
    }
  }, [text]);

  const isCompose = !isPosted && variant === "compose";

  return (
    <div className="relative">
      {/* Bubble */}
      <div
        onClick={() => {
          if (onBubbleClick) onBubbleClick();
        }}
        className={`relative rounded-3xl px-5 py-3 shadow-md max-w-xl w-auto flex flex-col items-center justify-center transition-all duration-200 cursor-pointer
          ${isPosted ? "bg-green-100" : isCompose ? "bg-[#2FA2FF]" : "bg-white"}`}
        style={{ minHeight: "60px", height: `${height + 20}px` }}
      >
        {isPosted ? (
          <p className="text-gray-800 font-semibold text-sm break-words whitespace-pre-wrap">
            {text}
          </p>
        ) : (
          <textarea
            ref={textareaRef}
            placeholder="Share a note"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className={`w-full text-sm border-none resize-none focus:outline-none bg-transparent overflow-hidden ${
              isCompose ? "text-white placeholder-white/90" : "text-gray-600 placeholder-gray-400"
            }`}
            rows={1}
          />
        )}

      {/* หาง bubble */}
        <span
          className={`absolute -bottom-2 left-1/2 transform -translate-x-1/2 -translate-x-5 w-3 h-3 rounded-full 
            ${isPosted ? "bg-green-100" : isCompose ? "bg-[#2FA2FF]" : "bg-white"}`}
        />
        <span
          className={`absolute -bottom-4.5 left-1/2 transform -translate-x-1/2 -translate-x-3 w-2 h-2 rounded-full 
            ${isPosted ? "bg-green-100" : isCompose ? "bg-[#2FA2FF]" : "bg-white"}`}
        />
    </div>


    {/* ปุ่ม + วางถัดจาก bubble */}
    {!isPosted && showButton && (
      <button
        onClick={handlePost}
        disabled={loading}
        className={`absolute -right-16 top-1/2 transform -translate-y-1/2 w-15 h-15 flex items-center justify-center rounded-full transition ${
          text.trim() ? "bg-transparent hover:bg-gray-300" : "bg-transparent opacity-60"
        }`}
      >
        <img src="/images/plus.png" alt="plus" className="w-9 h-9" />
      </button>
    )}
  </div>
  );
}

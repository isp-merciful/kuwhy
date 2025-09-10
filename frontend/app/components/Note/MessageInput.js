"use client";
import { useEffect, useRef, useState } from "react";

export default function MessageInput({
  text,
  setText,
  isPosted,
  handlePost,
  loading,
  setShowPopup,
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

  return (
  <div className="relative">
    {/* Bubble */}
<div
  onClick={() => isPosted && setShowPopup(true)}
  className={`rounded-2xl px-4 py-3 shadow-md max-w-xs w-auto flex flex-col items-center justify-center transition-all duration-200 cursor-pointer 
    ${isPosted ? "bg-green-100" : "bg-white"}`}
  style={{ minHeight: "60px", height: `${height + 20}px` }}
>
        {isPosted ? (
          <p className="text-gray-800 font-semibold text-sm break-words whitespace-pre-wrap ">{text}</p>
        ) : (
        <textarea
          ref={textareaRef}
          placeholder="คิดอะไรอยู่..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full text-gray-600 text-sm border-none resize-none focus:outline-none bg-transparent placeholder-gray-400 overflow-hidden"
          rows={1}
        />
      )}
    </div>

    {/* ปุ่ม + วางถัดจาก bubble */}
    {!isPosted && (
      <button
        onClick={handlePost}
        disabled={loading}
        className="absolute -right-16 top-1/2 transform -translate-y-1/2 w-15 h-15 flex items-center justify-center rounded-full hover:bg-gray-300 transition"
      >
        <img src="/images/plus.png" alt="plus" className="w-9 h-9" />
      </button>
    )}
  </div>
  );
}

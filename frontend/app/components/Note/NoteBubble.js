'use client'
import { useState, useEffect, useRef } from "react";
const personIcons = [
  "/images/person1.png",
  "/images/person2.png",
  "/images/person3.png",
];


export default function NoteBubble() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [height, setHeight] = useState(0);
  const textareaRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % personIcons.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => { 
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"; 
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      setHeight(textareaRef.current.scrollHeight);
    }
  }, [text]);

const handlePost = async () => {
  if (!text.trim()) {
    alert("กรุณาพิมพ์ข้อความก่อนส่ง!");
    return;
  }

  setLoading(true);

  const data = {
    message: text,           // ตรงกับ API
    username: "myUsername",  // ใส่ username จริง
    image: "/images/pfp.png" // optional
  };

  try {
    const response = await fetch("/api/note_api", { 
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    console.log("Server response:", result);

    if (response.ok) {
      setText(""); 
    } else {
      alert("เกิดข้อผิดพลาด: " + result.error);
    }
  } catch (error) {
    console.error(error);
    alert("ไม่สามารถเชื่อมต่อ server ได้");
  }

  setLoading(false);
};




  return (
    <div className="flex flex-col items-center w-full mt-6">
      <div className="flex items-center space-x-1">

         <div
          className="bg-white rounded-2xl px-4 py-3 shadow-md max-w-xs w-auto flex flex-col transition-all duration-200"
          style={{ minHeight: "60px", height: `${height + 20}px` }}
        > 
          <textarea
            ref={textareaRef}
            placeholder="คิดอะไรอยู่..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full text-gray-600 text-sm border-none resize-none focus:outline-none bg-transparent placeholder-gray-400 overflow-hidden"
            rows={1}
          />
        </div>
        <button

          onClick={handlePost}
          disabled={loading}
          className="w-15 h-15 flex items-center justify-center rounded-full hover:bg-gray-300 transition"
        >
          <img src="/images/plus.png" alt="plus" className="w-9 h-9" />
        </button>
      </div>

      <div className="mt-2 flex justify-center w-full">
        <img
          src={personIcons[currentIndex]}
          alt="person"
          className="w-20 h-20 rounded-full object-cover border border-gray-300"
        />
      </div>
    </div>
  );
}

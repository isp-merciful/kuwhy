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
  const [name, setName] = useState("anonymous");
  const [tempName, setTempName] = useState(name);
  const [isEditing, setIsEditing] = useState(false);

  // ✅ state หลังส่ง
  const [isPosted, setIsPosted] = useState(false);

  // ✅ popup state
  const [showPopup, setShowPopup] = useState(false);

  // โหลดข้อความจาก localStorage
  useEffect(() => {
    const savedText = localStorage.getItem("noteText");
    //const savedPosted = localStorage.getItem("notePosted");

    if (savedText) setText(savedText);
    //if (savedPosted === "true") setIsPosted(true);
  }, []);

  // ทุกครั้งที่เปลี่ยน isPosted → เก็บ
  // useEffect(() => {
  //   localStorage.setItem("notePosted", isPosted.toString());
  // }, [isPosted]);

  // บันทึกข้อความทุกครั้งที่เปลี่ยน
  useEffect(() => {
    localStorage.setItem("noteText", text);
  }, [text]);

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
      user_name: name,
      message: text,
    };

    console.log("Sending data:", data);
    try {
      const response = await fetch("http://localhost:8000/api/note_api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      console.log("Server response:", result);

      if (response.ok) {
        localStorage.removeItem("noteText");
        setIsPosted(true);
        alert("เพิ่มโน้ตสำเร็จ!");
      } else {
        alert("เกิดข้อผิดพลาด: " + result.error);
      }
    } catch (error) {
      console.error(error);
      alert("ไม่สามารถเชื่อมต่อ server ได้");
    }

    setLoading(false);
  };

  const confirmChange = () => {
    if (tempName.trim() !== "") {
      setName(tempName);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      confirmChange();
    }
    if (e.key === "Escape") {
      setTempName(name);
      setIsEditing(false);
    }
  };

  return (
    <div className="flex flex-col items-center w-full mt-6">
      <div className="flex items-center space-x-1">
        {/* ✅ ก่อนส่ง = textarea / หลังส่ง = bubble */}
        <div
          onClick={() => {
            if (isPosted) setShowPopup(true); // กด bubble เพื่อ popup
          }}
          className={`rounded-2xl px-4 py-3 shadow-md max-w-xs w-auto flex flex-col transition-all duration-200 cursor-pointer ${
            isPosted ? "bg-green-100" : "bg-white"
          }`}
          style={{ minHeight: "60px", height: `${height + 20}px` }}
        >
          {isPosted ? (
            <p className="text-gray-700 text-sm">{text}</p>
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

        {/* ✅ ปุ่มแสดงเฉพาะตอนยังไม่ได้โพสต์ */}
        {!isPosted && (
          <button
            onClick={handlePost}
            disabled={loading}
            className="w-15 h-15 flex items-center justify-center rounded-full hover:bg-gray-300 transition"
          >
            <img src="/images/plus.png" alt="plus" className="w-9 h-9" />
          </button>
        )}
      </div>

      {/* avatar */}
      <div className="mt-2 flex justify-center w-full">
        <img
          src={personIcons[currentIndex]}
          alt="person"
          className="w-20 h-20 rounded-full object-cover border border-gray-300"
        />
      </div>

      {/* name */}
      <div className="mt-2 flex justify-center">
        {isEditing && !isPosted ? (
          <input
            type="text"
            maxLength={15}
            className="text-sm text-gray-700 dark:text-gray-300 bg-transparent 
                      border-0 border-b border-gray-400 
                      focus:border-b-2 focus:border-blue-500 focus:outline-none 
                      transition"
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            onBlur={confirmChange}
            onKeyDown={handleKeyDown}
            autoFocus
          />
        ) : (
          <span
            className={`${
              isPosted ? "cursor-default text-gray-500" : "cursor-pointer hover:text-blue-500"
            } text-gray-600 dark:text-gray-400 transition`}
            onClick={() => {
              if (!isPosted) {   // ✅ กดแก้ไขได้เฉพาะตอนยังไม่ได้โพสต์
                setTempName(name);
                setIsEditing(true);
              }
            }}
          >
            {name}
          </span>
        )}
      </div>



      {/* ✅ popup modal */}
      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-10 z-50">
          <div className="bg-white rounded-xl p-6 w-80 shadow-lg">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              การตอบกลับ
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              test popup
            </p>
            <button
              onClick={() => setShowPopup(false)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              ปิด
            </button>
          </div>
        </div>
      )}
    </div>
  );
}




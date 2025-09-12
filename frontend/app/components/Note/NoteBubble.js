"use client";
import { useState } from "react";
import MessageInput from "./MessageInput";
import Avatar from "./Avatar";
import UserNameEditor from "./UserNameEditor";
import Popup from "./Popup";
import useLocalStorage from "./useLocalStorage";

export default function NoteBubble() {
  // ✅ ใช้ localStorage ทั้งข้อความและชื่อ
  const [text, setText] = useLocalStorage("noteText", "");
  const [name, setName] = useLocalStorage("noteUserName", "anonymous");

  const [loading, setLoading] = useState(false);
  const [isPosted, setIsPosted] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  const handlePost = async () => {
    if (!text.trim()) {
      alert("กรุณาพิมพ์ข้อความก่อนส่ง!");
      return;
    }

    setLoading(true);
    const data = { user_name: name, message: text };

    try {
      const response = await fetch("http://localhost:8000/api/note_api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (response.ok) {
        localStorage.removeItem("noteText");      // ล้างข้อความเมื่อโพสต์สำเร็จ
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

  return (
    <div className="flex flex-col items-center w-full mt-6 relative">
      <MessageInput
        text={text}
        setText={setText}
        isPosted={isPosted}
        handlePost={handlePost}
        loading={loading}
        setShowPopup={setShowPopup}
      />
      <Avatar />
      <UserNameEditor name={name} setName={setName} isPosted={isPosted} />
      <Popup
        showPopup={showPopup}
        setShowPopup={setShowPopup}
        text={text}
        setText={setText}
        name={name}
        setName={setName}
        isPosted={isPosted}
      />

    </div>
  );
}

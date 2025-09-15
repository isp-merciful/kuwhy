"use client";
import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import MessageInput from "./MessageInput";
import Avatar from "./Avatar";
import UserNameEditor from "./UserNameEditor";
import Popup from "./Popup";
import useLocalStorage from "./useLocalStorage";

export default function NoteBubble() {
  const [text, setText] = useLocalStorage("noteText", "");
  const [name, setName] = useLocalStorage("noteUserName", "anonymous");

  const [loading, setLoading] = useState(false);
  const [isPosted, setIsPosted] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [noteId, setNoteId] = useState(null);

  const [userId, setUserId] = useState("");

useEffect(() => {
  let id = localStorage.getItem("userId");

  if (id && id.startsWith('"') && id.endsWith('"')) {
    try {
      id = JSON.parse(id);
      localStorage.setItem("userId", id);
    } catch (e) {
      console.error("Invalid userId format, resetting:", e);
      id = null;
    }
  }

  if (!id) {
    id = uuidv4();
    localStorage.setItem("userId", id);
  }

  setUserId(id);
  console.log("UUID (fixed):", id);

  async function registerUser() {
    try {
      const res = await fetch("http://localhost:8000/api/create_users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: id,
          user_name: name, 
        }),
      });

      const data = await res.json();
      console.log("Register response:", data);
    } catch (error) {
      console.error("Register failed:", error);
    }
  }

  registerUser();
}, []);


  const handlePost = async () => {
    if (!text.trim()) {
      alert("กรุณาพิมพ์ข้อความก่อนส่ง!");
      return;
    }

    setLoading(true);
    console.log('userId:', userId);
    try {
      const response = await fetch("http://localhost:8000/api/note_api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
                  user_name: name,
                  message: text,
                  user_id: userId
                })
      });

      const result = await response.json();
      if (response.ok) {
        setNoteId(result.note_id); // ✅ เก็บ noteId
        setIsPosted(true);
        localStorage.removeItem("noteText");
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

      {/* Popup */}
      <Popup
        showPopup={showPopup}
        setShowPopup={setShowPopup}
        text={text}
        name={name}
        isPosted={isPosted}
        noteId={noteId}
        authorId={userId}
      />
    </div>
  );
}

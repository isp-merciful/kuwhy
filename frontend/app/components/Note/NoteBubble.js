"use client";
import { useState, useEffect } from "react";
import MessageInput from "./MessageInput";
import Avatar from "./Avatar";
import UserNameEditor from "./UserNameEditor";
import Popup from "./Popup";
import useUserId from "./useUserId";

export default function NoteBubble() {
  const userId = useUserId(); 
  const [text, setText] = useState("");
  const [name, setName] = useState("anonymous");
  const [loading, setLoading] = useState(false);
  const [isPosted, setIsPosted] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [noteId, setNoteId] = useState(null);

useEffect(() => {
  if (!userId) return;

  console.log("Current UUID:", userId);

  setName("anonymous");
  setText("");
  setNoteId(null);
  setIsPosted(false);

  async function fetchUser() {
    try {
      const res = await fetch(`http://localhost:8000/api/user/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setName(data.user_name || "anonymous");
      } else {
        setName("anonymous");
      }
    } catch {
      setName("anonymous");
    }
  }

  async function fetchNote() {
    try {
      const res = await fetch(`http://localhost:8000/api/note/user/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setNoteId(data.note_id);
        setText(data.message);
        setIsPosted(true);
      } else {
        setNoteId(null);
        setIsPosted(false);
      }
    } catch {
      setNoteId(null);
      setIsPosted(false);
    }
  }

  async function registerUser() {
    try {
      await fetch("http://localhost:8000/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          user_name: "anonymous", 
        }),
      });
    } catch (e) {
      console.error("Register failed:", e);
    }
  }

  registerUser().then(fetchUser).then(fetchNote);
}, [userId]);

  const handlePost = async () => {
    if (!text.trim()) return alert("กรุณาพิมพ์ข้อความก่อนส่ง!");

    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          message: text,
        }),
      });

      const result = await res.json();
      if (res.ok) {
        const newNoteId = result.note_id || result.value?.insertId;
        setNoteId(newNoteId);
        setIsPosted(true);
        alert("เพิ่มโน้ตสำเร็จ!");
      } else {
        alert("ไม่สามารถโพสต์ได้");
      }
    } catch (e) {
      alert("ไม่สามารถเชื่อมต่อ server ได้");
    } finally {
      setLoading(false);
    }
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
        name={name}
        isPosted={isPosted}
        noteId={noteId}
        userId={userId}
      />
    </div>
  );
}

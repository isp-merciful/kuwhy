"use client";
import { useState } from "react";
import MessageInput from "./MessageInput";
import Avatar from "./Avatar";
import UserNameEditor from "./UserNameEditor";

export default function Popup({ showPopup, setShowPopup, text, name, setText, setName, isPosted }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");

  if (!showPopup) return null;

  return (
    <div className="fixed inset-0 flex justify-center items-center z-50">
      {/* พื้นหลังเบลอ */}
      <div className="absolute inset-0 backdrop-blur-[1px] bg-black/10" onClick={() => setShowPopup(false)} />

      {/* กล่อง popup */}
      <div className="relative bg-white rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-xl overflow-hidden">
        {/* Header */}
        <div className="relative flex justify-between items-center p-4 ml-auto">
          <button
            onClick={() => setShowPopup(false)}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ✕
          </button>
        </div>

        {/* Note content ใช้ component เดิม */}
        <div className="p-4 border-b flex flex-col items-center space-y-2">
          <MessageInput
            text={text}
            setText={setText}
            isPosted={isPosted}
            handlePost={() => {}}
            loading={false}
            setShowPopup={() => {}}
          />
          <Avatar />
          <UserNameEditor name={name} setName={setName} isPosted={isPosted} />
        </div>

        {/* Comments */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {comments.length === 0 ? (
            <p className="text-gray-400 text-sm">ยังไม่มีคอมเมนต์</p>
          ) : (
            comments.map((c, i) => (
              <div key={i} className="flex items-start space-x-2">
                {/* Avatar placeholder */}
                <div className="w-8 h-8 rounded-full bg-gray-300 flex-shrink-0" />
                {/* Bubble คอมเมนต์ */}
                <div className="bg-gray-100 px-3 py-2 rounded-2xl text-sm text-gray-700">
                  {c}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Comment input */}
        <div className="p-3 border-t flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-gray-300 flex-shrink-0" />
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="เขียนคอมเมนต์..."
            className="flex-1 px-3 py-2 rounded-full bg-gray-100 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
          <button
            onClick={() => {
              if (!newComment.trim()) return;
              setComments((prev) => [...prev, newComment]);
              setNewComment("");
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded-full text-sm font-medium hover:bg-blue-600 transition"
          >
            ส่ง
          </button>
        </div>
      </div>
    </div>
  );
}

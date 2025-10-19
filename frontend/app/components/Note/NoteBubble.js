"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MessageInput from "./MessageInput";
import Avatar from "./Avatar";
import UserNameEditor from "./UserNameEditor";
import CommentSection from "./CommentSection";
import { TrashIcon, PlusIcon } from "@heroicons/react/24/outline";
import useUserId from "./useUserId";

export default function NoteBubble() {
  const userId = useUserId();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("anonymous");
  const [isPosted, setIsPosted] = useState(false);
  const [noteId, setNoteId] = useState(null);
  const [isComposing, setIsComposing] = useState(false);
  const [editNameOnExpand, setEditNameOnExpand] = useState(false);

  const buttonEnabled = text.trim().length > 0;

  // โหลด user และ note
  useEffect(() => {
    if (!userId) return;

    setName("anonymous");
    setText("");
    setNoteId(null);
    setIsPosted(false);

    async function fetchUser() {
      try {
        const res = await fetch(`http://localhost:8000/api/user/${userId}`);
        const data = await res.json();
        setName(data.user_name || "anonymous");
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
        }
      } catch {
        setIsPosted(false);
      }
    }

    async function registerUser() {
      try {
        await fetch("http://localhost:8000/api/user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId, user_name: "anonymous" }),
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
        body: JSON.stringify({ user_id: userId, message: text }),
      });

      const result = await res.json();
      if (res.ok) {
        const newNoteId = result.note_id || result.value?.insertId;
        setNoteId(newNoteId);
        setIsPosted(true);
        setIsComposing(false);
        alert("เพิ่มโน้ตสำเร็จ!");
      } else alert("ไม่สามารถโพสต์ได้");
    } catch {
      alert("ไม่สามารถเชื่อมต่อ server ได้");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!noteId) return;
    try {
      const res = await fetch(`http://localhost:8000/api/note/${noteId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setText("");
        setNoteId(null);
        setIsPosted(false);
        setIsComposing(false);
      } else alert("ไม่สามารถลบโน้ตได้");
    } catch {
      alert("ลบไม่สำเร็จ");
    }
  };

  return (
    <motion.div
      layout
      transition={{ type: "spring", stiffness: 120, damping: 18 }}
      className="flex flex-col items-center w-full relative"
    >
      <AnimatePresence mode="wait">
        {!isComposing ? (
          // Collapsed
          <motion.div
            key="collapsed"
            layout
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="cursor-pointer flex flex-col items-center"
            onClick={() => setIsComposing(true)}
          >
            <MessageInput
              text={text}
              setText={setText}
              isPosted={isPosted}
              isCompose={false}
              variant="collapsed"
              showButton={false}
            />

            <div className="relative mt-4">
              <Avatar />
            </div>

            <UserNameEditor
              name={name}
              setName={setName}
              isPosted={isPosted}
              editNameOnExpand={editNameOnExpand}
              setEditNameOnExpand={setEditNameOnExpand}
              onEditClick={() => {
                setIsComposing(true);
                setEditNameOnExpand(true);
              }}
            />
          </motion.div>
        ) : (
          // Expanded
          <motion.div
            key="expanded"
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-md flex flex-col items-center relative p-4"
          >
            {/* Back button */}
            <button
              onClick={() => setIsComposing(false)}
              className="absolute top-2 left-2 flex items-center space-x-1 text-gray-700 hover:text-gray-900"
            >
              <span className="text-xl">←</span>
              <span>Back</span>
            </button>

            {/* Message Bubble / Input */}
            <MessageInput
              text={text}
              setText={setText}
              isPosted={isPosted}
              handlePost={handlePost}
              loading={loading}
              variant="compose"
              showButton={false}
              isCompose={true}
            />

            {/* Avatar + Icon Buttons */}
            <div className="relative mt-6 flex items-center">
              <Avatar />

              {isPosted && (
                <div className="absolute -bottom-2 -right-2 flex space-x-2">
                  {/* Add New Note */}
                  <div className="group relative">
                    <button
                      onClick={async () => {
                        // ลบโน้ตเก่าก่อน
                        await handleDelete();

                        // เปิดหน้าเขียนโน้ตใหม่
                        setIsPosted(false);
                        setText("");
                        setNoteId(null);
                        setIsComposing(true);
                      }}
                      className="w-7 h-7 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition relative z-10"
                    >
                      <PlusIcon className="w-5 h-5" />
                    </button>

                    <span className="absolute -top-10 right-1/2 transform translate-x-1/2 px-3 py-1 text-sm rounded bg-gray-800 text-white opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap z-0 pointer-events-none">
                      Add New Note
                    </span>
                  </div>

                  {/* Delete */}
                  <div className="group relative">
                    <button
                      onClick={handleDelete}
                      className="w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition relative z-10"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                    <span className="absolute -top-10 right-1/2 transform translate-x-1/2 px-3 py-1 text-sm rounded bg-gray-800 text-white opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap z-0 pointer-events-none">
                      Delete
                    </span>
                  </div>
                </div>
              )}

            </div>

            {/* Name Editor */}
            <UserNameEditor
              name={name}
              setName={setName}
              isPosted={isPosted}
              editNameOnExpand={editNameOnExpand}
              setEditNameOnExpand={setEditNameOnExpand}
              onEditClick={null}
            />

            {/* Post / Description */}
            {!isPosted && (
              <>
                <button
                  onClick={handlePost}
                  disabled={!buttonEnabled || loading}
                  className={`px-6 py-2 rounded-full text-white mt-4 transition ${
                    buttonEnabled
                      ? "bg-[#2FA2FF] hover:bg-[#1d8de6]"
                      : "bg-gray-300 cursor-not-allowed"
                  }`}
                >
                  Post
                </button>

                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-gray-500 text-sm mt-4 text-center max-w-sm"
                >
                  Share quick thoughts, polls, or group invites that disappear in 24 hours.
                </motion.p>
              </>
            )}

            {/* Comment Section */}
            {isPosted &&   
                <div className="w-full bg-white rounded-xl p-4 mt-4 shadow-inner flex-1 overflow-y-auto">
                  <CommentSection noteId={noteId} userId={userId} />
                </div>}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

"use client";
import { useState, useEffect } from "react";

export default function CommentSection({ noteId, authorId }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    if (!noteId) return;

    const fetchComments = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/comment/${noteId}`);
        const data = await res.json();
        setComments(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("❌ Fetch comments failed:", err);
      }
    };

    fetchComments();
  }, [noteId]);

  const handleSubmit = async () => {
    if (!newComment.trim()) return;

    try {
      const payload = {
        note_id: noteId,
        author: authorId,
        content: newComment,
        user_name: localStorage.getItem("noteUserName") || "anonymous",
      };

      const res = await fetch("http://localhost:8000/api/comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to post comment");

      const created = await res.json();
      setComments((prev) => [...prev, created]);
      setNewComment("");
    } catch (err) {
      console.error("❌ Error posting comment:", err);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {comments.length === 0 && (
        <p className="text-gray-400 text-sm text-center">ยังไม่มีคอมเม้น</p>
      )}

      {comments.map((c) => (
        <div key={c.comment_id} className="flex gap-3 items-start">
          <img
            src="/images/person2.png"
            alt="avatar"
            className="w-8 h-8 rounded-full object-cover"
          />
          <div className="flex-1">
            <p className="text-sm">
              <span className="font-semibold text-gray-800 mr-1">
                {c.user_name || "anonymous"}
              </span>
              {c.content}
            </p>
            <span className="text-gray-400 text-xs">
              {new Date(c.created_at).toLocaleString()}
            </span>
          </div>
        </div>
      ))}

      {/* Input comment */}
      <div className="flex gap-2 mt-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="เขียนความคิดเห็น..."
        />
        <button
          onClick={handleSubmit}
          className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition"
        >
          ส่ง
        </button>
      </div>
    </div>
  );
}

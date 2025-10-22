"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CommentForm({ blogId }) {
  const [message, setMessage] = useState("");
  const [userId, setUserId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    try {
      let id = localStorage.getItem("userId");
      if (id && id.startsWith('"') && id.endsWith('"')) {
        id = JSON.parse(id);
        localStorage.setItem("userId", id);
      }
      setUserId(id || null);
    } catch {
      setUserId(null);
    }
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    const text = message.trim();
    if (!text) return;

    setSubmitting(true);
    const body = userId
      ? { message: text, blog_id: blogId, user_id: userId }
      : { message: text, blog_id: blogId, isAnonymous: true };

    const res = await fetch("http://localhost:8000/api/comment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      setSubmitting(false);
      return;
    }

    setMessage("");
    setSubmitting(false);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 rounded-xl border border-gray-200 p-4">
      <label className="mb-2 block text-sm font-medium text-gray-700">
        Add a comment
      </label>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Write something nice…"
        className="w-full min-h-[90px] rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting || !message.trim()}
          className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          {submitting ? "Posting…" : "Post comment"}
        </button>
      </div>
    </form>
  );
}

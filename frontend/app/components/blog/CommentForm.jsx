"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CommentForm({ blogId, userId = "u1-1111-aaaa" }) {
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function onSubmit(e) {
    e.preventDefault();
    const text = message.trim();
    if (!text) return;

    setSubmitting(true);
    try {
      const res = await fetch("http://localhost:8000/api/comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blog_id: Number(blogId), // stays number
          user_id: userId,         // <-- now a string (e.g., "u1-1111-aaaa")
          message: text,
        }),
      });

      if (!res.ok) {
        let msg = "Failed to post comment";
        try {
          const data = await res.json();
          if (data?.error || data?.message) msg = data.error || data.message;
        } catch {}
        throw new Error(msg);
      }

      setMessage("");
      router.refresh(); // show the new comment
    } catch (err) {
      alert(err.message || "Failed to post comment");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-3">
      <label className="block text-sm font-medium text-gray-700">
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

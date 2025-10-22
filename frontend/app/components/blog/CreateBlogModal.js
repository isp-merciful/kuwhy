"use client";
import { useState, useEffect } from "react";

export default function CreateBlogModal() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  const [userId, setUserId] = useState("");

  useEffect(() => {
    let id = null;
    try {
      id = localStorage.getItem("userId");
      if (id && id.startsWith('"') && id.endsWith('"')) {
        id = JSON.parse(id);
        localStorage.setItem("userId", id);
      }
    } catch {}
    if (!id) {
      // If missing, we'll post anonymously instead of generating a new id here.
      setUserId(null);
    } else {
      setUserId(id);
    }
  }, []);

  const handleSubmit = async () => {
    if (!title.trim() || !message.trim()) return;

    const payload = userId
      ? { blog_title: title.trim(), message: message.trim(), user_id: userId }
      : { blog_title: title.trim(), message: message.trim(), isAnonymous: true };

    const res = await fetch("http://localhost:8000/api/blog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.error(await res.text());
      return;
    }

    setTitle("");
    setMessage("");
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-md bg-black px-3 py-2 text-white hover:bg-black/80"
      >
        Write a blog
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold">New blog post</h2>

            <label className="mt-4 block text-sm text-gray-700">
              Title
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Give it a clear title…"
              />
            </label>

            <label className="mt-4 block text-sm text-gray-700">
              Message
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="mt-1 w-full min-h-[120px] rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Write your post…"
              />
            </label>

            <div className="mt-6 flex justify-end gap-3">
              <button className="rounded-md border px-4 py-2" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="rounded-md bg-lime-500 px-4 py-2 text-white hover:bg-lime-600"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

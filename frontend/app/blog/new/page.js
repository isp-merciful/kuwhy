"use client";
import { useEffect, useState } from "react";
import { Navbar } from "../../components/navbar";
import Avatar from "../../components/Note/Avatar";
import useLocalStorage from "../../components/Note/useLocalStorage";

export default function NewBlogPage() {
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useLocalStorage("userId", null);
  const [userName, setUserName] = useLocalStorage("userName", "anonymous");

  useEffect(() => {
    async function ensureUser() {
      try {
        let id = userId;
        if (!id) {
          id = crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
          setUserId(id);
        }
        await fetch("http://localhost:8000/api/user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: id, user_name: userName || "anonymous" }),
        });
      } catch {}
    }
    ensureUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canSubmit = title.trim() && detail.trim();

  const ensureUserNow = async () => {
    let id = userId || (typeof window !== "undefined" ? localStorage.getItem("userId") : null);
    if (!id) {
      id = crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
      setUserId(id);
      if (typeof window !== "undefined") localStorage.setItem("userId", JSON.stringify(id));
    }
    try {
      await fetch("http://localhost:8000/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: id, user_name: userName || "anonymous" }),
      });
    } catch {}
    return id;
  };

  const handleCreate = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      const id = await ensureUserNow();
      const res = await fetch("http://localhost:8000/api/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: id, blog_title: title.trim(), message: detail.trim() }),
      });
      if (!res.ok) throw new Error("Create blog failed");
      window.location.href = "/blog";
    } catch (e) {
      console.error(e);
      alert("Failed to create blog. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <section className="relative isolate overflow-hidden py-12 bg-gradient-to-b from-[#DDF3FF] to-[#E8FFF2] min-h-screen">
        <div className="max-w-5xl mx-auto px-4">
          <div className="mb-4">
            <button
              onClick={() => (window.location.href = "/blog")}
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <span className="text-xl">←</span>
              <span>Back</span>
            </button>
          </div>

          <div className="flex items-start gap-6 mb-8">
            <Avatar center={false} size={24} />
            <div className="flex-1 max-w-2xl mx-auto">
              <div className="text-gray-500 mb-2 text-center">{userName}</div>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Add Your Title..."
                className="bg-[#54E0C7] placeholder-white/90 text-white rounded-3xl px-6 py-4 w-full shadow outline-none"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow px-6 py-5 border border-gray-200 max-w-4xl">
            <textarea
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="Add your detailed..."
              rows={8}
              className="w-full outline-none text-gray-700 placeholder-gray-400"
            />
            <div className="flex justify-end mt-4">
              <button
                onClick={handleCreate}
                disabled={!canSubmit || loading}
                className={`rounded-full w-10 h-10 flex items-center justify-center shadow ${
                  canSubmit ? "bg-[#1a73e8] text-white" : "bg-gray-300 text-white cursor-not-allowed"
                }`}
              >
                +
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}



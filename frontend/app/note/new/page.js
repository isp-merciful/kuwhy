"use client";
import { useState, useEffect } from "react";
import { Navbar } from "../../components/navbar";
import Avatar from "../../components/Note/Avatar";
import MessageInput from "../../components/Note/MessageInput";
import useLocalStorage from "../../components/Note/useLocalStorage";

export default function NewNotePage() {
  const [text, setText] = useState("");
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

  const handlePost = async () => {
    if (!text.trim() || !userId) return;
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text.trim(), user_id: userId }),
      });
      if (!res.ok) throw new Error("Post failed");
      setText("");
      window.location.href = "/note";
    } finally {
      setLoading(false);
    }
  };

  const buttonEnabled = text.trim().length > 0;

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <section className="relative isolate overflow-hidden py-12 bg-gradient-to-b from-[#DDF3FF] to-[#E8FFF2] min-h-screen">
        <div className="max-w-5xl mx-auto px-4">
          <div className="mb-4">
            <button
              onClick={() => (window.location.href = "/note")}
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <span className="text-xl">←</span>
              <span>Back</span>
            </button>
          </div>
          <h2 className="text-2xl font-bold mb-6">Casual Note</h2>
          <div className="flex flex-col items-center gap-4">
            <MessageInput
              text={text}
              setText={setText}
              isPosted={false}
              handlePost={handlePost}
              loading={loading}
              setShowPopup={() => {}}
              variant="compose"
              showButton={false}
            />
            <Avatar />
            <button
              onClick={handlePost}
              disabled={!buttonEnabled || loading}
              className={`mt-2 rounded-full px-6 py-2 text-white transition ${
                buttonEnabled ? "bg-[#2FA2FF] hover:bg-[#1d8de6]" : "bg-gray-300 cursor-not-allowed"
              }`}
            >
              Share a note
            </button>

            <p className="mt-4 text-gray-500 text-center max-w-xl">
              Share quick thoughts, polls, or group invites that disappear in 24 hours.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}



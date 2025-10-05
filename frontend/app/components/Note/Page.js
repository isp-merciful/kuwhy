"use client";
import { useEffect, useState } from "react";
import NoteContainer from "./NoteContainer";
import MessageInput from "./MessageInput";
import Avatar from "./Avatar";
import UserNameEditor from "./UserNameEditor";
import useLocalStorage from "./useLocalStorage";

export default function NotePageSection() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Persisted user identity
  const [userId, setUserId] = useLocalStorage("userId", null);
  const [userName, setUserName] = useLocalStorage("userName", "anonymous");

  // Ensure a user exists in backend matching local identity
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
      } catch (e) {
        console.error("Failed to ensure user:", e);
      }
    }
    ensureUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePost = async () => {
    if (!text.trim()) return;
    if (!userId) return;
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text.trim(), user_id: userId }),
      });
      if (!res.ok) throw new Error("Post note failed");
      setText("");
      setRefreshKey((k) => k + 1); // refresh list
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <section className="relative isolate overflow-hidden py-10 bg-gradient-to-b from-[#DDF3FF] to-[#E8FFF2] min-h-screen">
        <div className="max-w-5xl mx-auto px-4">
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
              onBubbleClick={() => {
                window.location.href = "/note/new";
              }}
            />
            <Avatar />
            <UserNameEditor name={userName} setName={setUserName} isPosted={false} />
          </div>
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <NoteContainer key={refreshKey} />
      </main>
    </>
  );
}

 

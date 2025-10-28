"use client";
import { useEffect, useState } from "react";
import CommentSection from "./CommentSection";
import MessageInput from "./MessageInput";
import Avatar from "./Avatar";
import UserNameEditor from "./UserNameEditor";
import PartyChat from "./PartyChat";

export default function Popup({
  showPopup,
  setShowPopup,
  text,
  name,
  isPosted,
  noteId,
  maxParty = 0,
  currParty = 0,
  ownerId,
  viewerUserId,
}) {
  if (!showPopup) return null;

  const [joined, setJoined] = useState(false);
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [curr, setCurr] = useState(Number(currParty || 0));
  const [max, setMax] = useState(Number(maxParty || 0));

  const isParty = max > 0;
  const isOwner = ownerId && viewerUserId && ownerId === viewerUserId;
  const isFull = isParty && curr >= max;

  // ถ้าเป็นเจ้าของห้อง ให้ถือว่า joined
  useEffect(() => {
    if (isOwner && isParty) setJoined(true);
  }, [isOwner, isParty]);

  // ตรวจเคย join แล้วหรือยัง → ถ้าเคย ให้เปิดห้องแชทเลย
  useEffect(() => {
    let alive = true;
    async function checkJoined() {
      if (!isParty || !viewerUserId || !noteId) return;
      try {
        const r = await fetch(`http://localhost:8000/api/note/membership/${noteId}/${viewerUserId}`, { cache: "no-store" });
        if (!alive) return;
        if (!r.ok) return; // เงียบไว้
        const d = await r.json();
        // d.joined = true/false
        if (d?.joined) setJoined(true);
      } catch {}
    }
    checkJoined();
    return () => { alive = false; };
  }, [isParty, noteId, viewerUserId]);

  const handleJoin = async () => {
    if (!isParty || !noteId || !viewerUserId || isFull) return;
    setJoining(true);
    try {
      const res = await fetch("http://localhost:8000/api/note/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note_id: Number(noteId), user_id: viewerUserId }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data?.error || "Join failed");
      } else {
        setJoined(true); // ✅ เปิดแชททันที
        if (data?.data?.crr_party != null) setCurr(Number(data.data.crr_party));
        if (data?.data?.max_party != null) setMax(Number(data.data.max_party));
      }
    } catch {
      alert("ไม่สามารถเชื่อมต่อ server ได้");
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async () => {
    if (!isParty || !noteId || !viewerUserId || isOwner) return;
    setLeaving(true);
    try {
      const res = await fetch("http://localhost:8000/api/note/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note_id: Number(noteId), user_id: viewerUserId }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data?.error || "Leave failed");
      } else {
        setJoined(false);
        if (data?.data?.crr_party != null) setCurr(Number(data.data.crr_party));
      }
    } catch {
      alert("ไม่สามารถเชื่อมต่อ server ได้");
    } finally {
      setLeaving(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm z-50">
      <div className="relative bg-white rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-xl overflow-hidden">
        {/* Close */}
        <div className="flex justify-end p-3">
          <button
            onClick={() => setShowPopup(false)}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ✕
          </button>
        </div>

        {/* Header: bubble + avatar + ชิปปาร์ตี้ */}
        <div className="px-5 -mt-2">
          <MessageInput
            text={text}
            setText={() => {}}
            isPosted={true}
            isCompose={false}
            variant="collapsed"
            showButton={false}
            readOnly
          />
        </div>

        <div className="px-6 pt-2 flex flex-col items-center gap-2">
          <Avatar />
          <UserNameEditor
            name={name}
            setName={() => {}}
            isPosted={true}
            editNameOnExpand={false}
            setEditNameOnExpand={() => {}}
            onEditClick={null}
            readOnly
          />
          {isParty && (
            <div className="mt-1">
              <span className="inline-flex items-center gap-2 text-sm bg-white/90 backdrop-blur rounded-full px-3 py-1 border border-gray-200 shadow-sm">
                <span>🎉 Party</span>
                <span className="font-semibold">{curr}</span>
                <span className="text-gray-500">/</span>
                <span className="font-semibold">{max}</span>
              </span>
              {!isOwner && joined && (
                <button
                  onClick={handleLeave}
                  disabled={leaving}
                  className={`ml-2 px-3 py-1 rounded-full text-sm text-white transition ${
                    leaving ? "bg-gray-400" : "bg-red-500 hover:bg-red-600"
                  }`}
                >
                  {leaving ? "Leaving..." : "Leave"}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 px-4 pb-4 pt-3 overflow-hidden">
          <div className="w-full h-full bg-white rounded-2xl border shadow-inner overflow-hidden">
            {/* ถ้าเป็น party */}
            {isParty ? (
              joined ? (
                // ✅ เคย join แล้ว / เพิ่ง join สำเร็จ → เปิดแชททันที
                <div className="h-full">
                  <div className="px-4 py-2 border-b text-lg font-semibold sticky top-0 bg-white z-10">
                    Chat
                  </div>
                  <div className="h-[calc(100%-2.5rem)] p-3">
                    <PartyChat noteId={noteId} userId={viewerUserId} />
                  </div>
                </div>
              ) : (
                // ยังไม่ join → แสดงปุ่ม join
                <div className="h-full flex flex-col items-center justify-center text-center px-6">
                  <div className="text-3xl">💬</div>
                  <div className="mt-2 font-semibold text-gray-800">
                    Join this party to view group chat
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    note #{noteId} • {curr}/{max} คน
                  </div>
                  <button
                    onClick={handleJoin}
                    disabled={joining || isFull}
                    className={`mt-4 px-6 py-2 rounded-full text-white transition ${
                      isFull || joining
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-[#2FA2FF] hover:bg-[#1d8de6]"
                    }`}
                  >
                    {isFull ? "Party is full" : joining ? "Joining..." : "Join Party"}
                  </button>
                </div>
              )
            ) : (
              // โน้ตธรรมดา → คอมเมนต์
              <div className="h-full flex flex-col">
                <div className="px-4 py-2 border-b text-lg font-semibold sticky top-0 bg-white z-10">
                  Comments
                </div>
                <div className="flex-1 p-3 overflow-y-auto">
                  <CommentSection noteId={noteId} userId={viewerUserId} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

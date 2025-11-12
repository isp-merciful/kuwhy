// frontend/app/components/NoteBubble.js
"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import MessageInput from "./MessageInput";
import Avatar from "./Avatar";
import UserNameEditor from "./UserNameEditor";
import CommentSection from "./CommentSection";
import { TrashIcon, PlusIcon } from "@heroicons/react/24/outline";
import PartyChat from "./PartyChat";
import useUserId from "./useUserId";
import ConfirmDeleteDialog from "./ConfirmDeleteDialog";
import ConfirmReplaceDialog from "./ConfirmReplaceDialog";

export default function NoteBubble() {
  // --- session / token ---
  const { data: session, status } = useSession();
  const authed = status === "authenticated" && !!session?.user?.id;
  const ready = status !== "loading";
  const apiToken = authed ? session?.apiToken : null;
  const authHeaders = useMemo(
    () => (apiToken ? { Authorization: `Bearer ${apiToken}` } : {}),
    [apiToken]
  );

  // --- user id: ตรึงให้เสถียร ---
  const localOrAuthId = useUserId(); // อาจเป็น anonymous หรือ id จริง
  const stableUserIdRef = useRef(null);
  useEffect(() => {
    if (authed && session.user.id) {
      stableUserIdRef.current = String(session.user.id);
    } else if (!stableUserIdRef.current) {
      stableUserIdRef.current = String(localOrAuthId || "");
    }
  }, [authed, session?.user?.id, localOrAuthId]);
  const userId = stableUserIdRef.current || localOrAuthId || null;

  // --- ui states ---
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("anonymous");
  const [isPosted, setIsPosted] = useState(false);
  const [noteId, setNoteId] = useState(null);
  const [isComposing, setIsComposing] = useState(false);
  const [editNameOnExpand, setEditNameOnExpand] = useState(false);

  // dialog box
  const [showDelete, setShowDelete] = useState(false);
  const [showReplace, setShowReplace] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [replacing, setReplacing] = useState(false);

  // --- party states ---
  const [isParty, setIsParty] = useState(false);
  const [maxParty, setMaxParty] = useState(0);
  const [currParty, setCurrParty] = useState(0);
  const [joinedMemberOnly, setJoinedMemberOnly] = useState(false);

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);
  const buttonEnabled = text.trim().length > 0;

  // --------------------------
  // helpers
  // --------------------------
  const extractServerName = (u) => {
    const candidate =
      u?.user_name ??
      u?.user?.user_name ??
      u?.users?.user_name ??
      u?.value?.user_name ??
      u?.name;
    return typeof candidate === "string" ? candidate : null;
  };
  const extractServerImg = (u) => {
    const candidate = u?.img ?? u?.user?.img ?? u?.users?.img ?? u?.value?.img;
    return typeof candidate === "string" ? candidate : null;
  };

  // --------------------------
  // Avatar persistence
  // --------------------------
  const [serverImg, setServerImg] = useState(null);
  const pendingAvatarUrlRef = useRef(null);

  const handleAvatarUrlReady = (url) => {
    if (!serverImg && url) pendingAvatarUrlRef.current = url;
  };

  const persistAvatarIfNeeded = async () => {
    if (serverImg) return;
    const url = pendingAvatarUrlRef.current;
    if (!url || !userId) return;

    try {
      const targetId = authed ? session.user.id : userId;
      const res = await fetch(
        `http://localhost:8000/api/user/${encodeURIComponent(targetId)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json", ...authHeaders },
          body: JSON.stringify({ img: url }),
        }
      );
      if (res.ok) {
        setServerImg(url);
      } else {
        console.warn("[avatar] persist failed:", await res.text());
      }
    } catch (e) {
      console.warn("[avatar] persist error:", e);
    }
  };

  useEffect(() => {
    pendingAvatarUrlRef.current = null;
  }, [userId]);

  // --------------------------
  // initial load (profile + note)
  // --------------------------
  useEffect(() => {
    if (!userId || !ready) return;

    // reset note/party states (ไม่แตะ name)
    setText("");
    setNoteId(null);
    setIsPosted(false);
    setIsParty(false);
    setMaxParty(0);
    setCurrParty(0);
    setJoinedMemberOnly(false);

    const controller = new AbortController();

    if (
      authed &&
      session?.user?.name &&
      session.user.name.toLowerCase() !== "anonymous"
    ) {
      setName(session.user.name);
    }

    async function fetchUserOnce() {
      try {
        const res = await fetch(`http://localhost:8000/api/user/${userId}`, {
          signal: controller.signal,
          cache: "no-store",
          headers: { ...authHeaders },
        });
        if (!mountedRef.current || !res.ok) return null;
        const data = await res.json();
        if (!mountedRef.current) return null;
        return data;
      } catch {
        return null;
      }
    }

    async function fetchNote() {
      try {
        const res = await fetch(
          `http://localhost:8000/api/note/user/${userId}`,
          {
            signal: controller.signal,
            cache: "no-store",
            headers: { ...authHeaders },
          }
        );
        if (!mountedRef.current) return;

        if (!res.ok) {
          setIsPosted(false);
          setNoteId(null);
          setText("");
          setIsParty(false);
          setMaxParty(0);
          setCurrParty(0);
          setJoinedMemberOnly(false);
          return;
        }

        const raw = await res.json();
        const data = raw?.note === null ? null : raw;

        if (data?.note_id) {
          setNoteId(data.note_id);
          setText(data?.message ?? "");
          setIsPosted(true);

          const mp = Number(data?.max_party) || 0;
          const cp = Number(data?.crr_party) || 0;
          setIsParty(mp > 0);
          setMaxParty(mp > 0 ? mp : 0);
          setCurrParty(mp > 0 ? Math.max(1, cp) : 0);
          setJoinedMemberOnly(!!data?.joined_member_only);
        } else {
          setIsPosted(false);
          setNoteId(null);
          setText("");
          setIsParty(false);
          setMaxParty(0);
          setCurrParty(0);
          setJoinedMemberOnly(false);
        }
      } catch {
        if (!mountedRef.current) return;
        setIsPosted(false);
        setNoteId(null);
        setText("");
        setIsParty(false);
        setMaxParty(0);
        setCurrParty(0);
        setJoinedMemberOnly(false);
      }
    }

    (async () => {
      const u = await fetchUserOnce();
      if (mountedRef.current && u) {
        const serverName = extractServerName(u);
        if (
          serverName &&
          serverName.trim() &&
          serverName.toLowerCase() !== "anonymous"
        ) {
          setName(serverName.trim());
        }
        const img = extractServerImg(u);
        if (img && typeof img === "string") setServerImg(img);
        else setServerImg(null);
      }
      await fetchNote();
    })();

    return () => controller.abort();
  }, [userId, ready, authed, session?.user?.name, authHeaders]);

  // --------------------------
  // Actions
  // --------------------------
  const handlePost = async () => {
    if (!ready) return alert("กำลังตรวจสอบสถานะผู้ใช้… ลองใหม่อีกครั้ง");
    if (!userId) return alert("ไม่พบผู้ใช้ กรุณารีเฟรชหน้า");
    if (!text.trim()) return alert("กรุณาพิมพ์ข้อความก่อนส่ง!");
    if (isParty && !authed) return alert("You need to log in first before creating a party.");

    setLoading(true);
    try {
      const payload = {
        user_id: userId,
        message: text,
        max_party: isParty
          ? Math.min(20, Math.max(2, Number(maxParty) || 2))
          : 0,
      };

      const res = await fetch("http://localhost:8000/api/note", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (res.ok) {
        const newNoteId =
          result?.value?.note_id ?? result?.note?.note_id ?? result?.note_id;

        const serverMax =
          result?.note?.max_party ?? result?.value?.max_party ?? 0;
        const serverCurr =
          result?.note?.crr_party ??
          result?.value?.crr_party ??
          (serverMax > 0 ? 1 : 0);

        setNoteId(newNoteId ?? null);
        setIsPosted(true);
        setIsComposing(false);
        setIsParty((Number(serverMax) || 0) > 0);
        setMaxParty(Number(serverMax) || 0);
        setCurrParty(Number(serverCurr) || 0);
        setJoinedMemberOnly(false);

        await persistAvatarIfNeeded();
      } else {
        alert(result?.error || "ไม่สามารถโพสต์ได้");
      }
    } catch {
      alert("ไม่สามารถเชื่อมต่อ server ได้");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!noteId) return;
    if (joinedMemberOnly)
      return alert("You have joined this party and cannot delete other people's notes.");
    try {
      const res = await fetch(`http://localhost:8000/api/note/${noteId}`, {
        method: "DELETE",
        
      });
      if (res.ok) {
        setText("");
        setNoteId(null);
        setIsPosted(false);
        setIsComposing(false);
        setIsParty(false);
        setMaxParty(0);
        setCurrParty(0);
        setJoinedMemberOnly(false);
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data?.error || "ไม่สามารถลบโน้ตได้");
      }
    } catch {
      alert("ลบไม่สำเร็จ");
    }
  };

  const handleLeaveParty = async () => {
    if (!noteId || !userId) return;
    try {
      const res = await fetch("http://localhost:8000/api/note/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ note_id: Number(noteId), user_id: userId }),
      });
      const data = await res.json();
      if (!res.ok) return alert(data?.error || "Leave failed");

      setText("");
      setNoteId(null);
      setIsPosted(false);
      setIsParty(false);
      setMaxParty(0);
      setCurrParty(0);
      setJoinedMemberOnly(false);
    } catch {
      alert("ไม่สามารถเชื่อมต่อ server ได้");
    }
  };

  // --------------------------
  // UI helpers
  // --------------------------
  const PartySwitch = useMemo(
    () => (
      <button
        type="button"
        onClick={() => {
          if (isPosted) return;
          const next = !isParty;
          setIsParty(next);
          if (next) {
            setMaxParty((prev) => {
              const n = Number(prev) || 0;
              return n >= 2 ? Math.min(20, n) : 2;
            });
            setCurrParty(1);
          } else {
            setMaxParty(0);
            setCurrParty(0);
          }
        }}
        className={`relative inline-flex h-5 w-10 items-center rounded-full transition-all ${
          isParty ? "bg-blue-500" : "bg-gray-300"
        } ${isPosted ? "opacity-60 cursor-not-allowed" : ""}`}
        disabled={isPosted}
        aria-pressed={isParty}
        aria-label="เปิด/ปิดปาร์ตี้"
        title="Party"
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all ${
            isParty ? "translate-x-5" : "translate-x-1"
          }`}
        />
      </button>
    ),
    [isParty, isPosted]
  );

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
              {/* ถ้ามีรูปใน DB แล้ว → ใช้ src, ถ้าไม่มีก็ให้ Avatar สุ่มแล้วส่ง url กลับ */}
              <Avatar
                src={serverImg || undefined}
                onUrlReady={!serverImg ? handleAvatarUrlReady : undefined}
              />
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
            className="w-full max-w-md flex flex-col items-center relative p-4 pt-12"
          >
            {/* Back button */}
            <button
              onClick={() => setIsComposing(false)}
              className="absolute top-2 left-2 flex items-center space-x-1 text-gray-700 hover:text-gray-900"
            >
              <span className="text-xl">←</span>
              <span>Back</span>
            </button>

            {/* Input */}
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

            {/* Avatar + FABs */}
            <div className="relative mt-5">
              <div className="relative inline-block">
                <Avatar
                  src={serverImg || undefined}
                  onUrlReady={!serverImg ? handleAvatarUrlReady : undefined}
                />
                {isPosted && !joinedMemberOnly && (
                  <div className="absolute -bottom-2 -right-2 flex space-x-2">
                    {/* + = replace (ยืนยันก่อน) */}
                    <button
                      onClick={() => setShowReplace(true)}
                      className="w-7 h-7 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center shadow"
                      title="Add New Note"
                    >
                      <PlusIcon className="w-5 h-5" />
                    </button>
                    {/* 🗑 = delete (ยืนยันก่อน) */}
                    <button
                      onClick={() => setShowDelete(true)}
                      className="w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow disabled:opacity-50"
                      title="Delete"
                      disabled={!noteId}
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* ปุ่มโพสต์ */}
            {!isPosted && (
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
            )}

            {/* แผงปาร์ตี้เล็ก */}
            {!isPosted && (
              <motion.div
                key="party-mini"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.2 }}
                className="mt-3"
              >
<div className="inline-flex items-center gap-2 text-sm bg-white/70 backdrop-blur rounded-full px-3 py-1 border border-gray-200 shadow-sm">
  <span className="select-none">🎉 Party</span>
  {PartySwitch}
  <span className={`text-gray-500 ${!isParty ? "opacity-50" : ""}`}>max</span>

  <div className="flex items-center gap-1">
    <input
      type="number"
      min={2}
      max={20}
      step={1}
      value={isParty ? Number(maxParty) || 2 : 0}
      onChange={(e) => {
        if (!isParty) return;
        let v = Math.floor(Math.abs(Number(e.target.value) || 0));
        if (v < 2) v = 2;
        if (v > 20) v = 20;
        setMaxParty(v);
      }}
      className="w-14 text-center bg-transparent outline-none border rounded-md py-1"
      disabled={!isParty}
      aria-label="จำนวนสมาชิกสูงสุด"
    />

    {/* ปุ่ม + ชิดเลข */}
    <button
      type="button"
      onClick={() => {
        if (!isParty) return;
        setMaxParty((prev) => {
          const n = Math.max(2, Math.min(20, Number(prev) || 2));
          return Math.min(20, n + 1);
        });
      }}
      className={`w-8 h-8 grid place-items-center rounded-md border transition
                  ${isParty ? "hover:bg-white active:scale-95" : "opacity-50 cursor-not-allowed"}`}
      disabled={!isParty}
      aria-label="เพิ่มจำนวน"
      title="เพิ่มจำนวน"
    >
      +
    </button>

    {/* ปุ่ม − อยู่ขวาสุด */}
    <button
      type="button"
      onClick={() => {
        if (!isParty) return;
        setMaxParty((prev) => {
          const n = Math.max(2, Math.min(20, Number(prev) || 2));
          return Math.max(2, n - 1);
        });
      }}
      className={`w-8 h-8 grid place-items-center rounded-md border transition
                  ${isParty ? "hover:bg-white active:scale-95" : "opacity-50 cursor-not-allowed"}`}
      disabled={!isParty}
      aria-label="ลดจำนวน"
      title="ลดจำนวน"
    >
      −
    </button>
  </div>
</div>

              </motion.div>
            )}

            {/* party chip + Leave */}
            {isPosted && isParty && maxParty > 0 && (
              <div className="mt-3 flex items-center gap-3">
                <div className="inline-flex items-center gap-2 text-sm bg-white/90 backdrop-blur rounded-full px-3 py-1 border border-gray-200 shadow-sm">
                  <span>🎉 Party</span>
                  <span className="font-semibold">{currParty}</span>
                  <span className="text-gray-500">/</span>
                  <span className="font-semibold">{maxParty}</span>
                </div>
                {joinedMemberOnly && (
                  <button
                    onClick={handleLeaveParty}
                    className="text-sm px-3 py-1 rounded-full border border-red-300 text-red-600 hover:bg-red-50"
                  >
                    Leave
                  </button>
                )}
              </div>
            )}

            {/* ชื่อผู้ใช้ */}
            <div className="mt-2">
              <UserNameEditor
                name={name}
                setName={setName}
                isPosted={isPosted}
                editNameOnExpand={editNameOnExpand}
                setEditNameOnExpand={setEditNameOnExpand}
                onEditClick={null}
              />
            </div>

            {/* คำอธิบาย */}
            {!isPosted && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="text-gray-500 text-sm mt-3 text-center max-w-sm"
              >
                Share quick thoughts or start group activities (login required) that disappear in 24 hours.
              </motion.p>
            )}

            {/* ส่วนล่าง */}
            {isPosted && noteId && (
              <div className="w-full bg-white rounded-xl p-4 mt-4 shadow-inner flex-1 overflow-y-auto">
                {isParty && maxParty > 0 ? (
                  <div className="h-60 flex flex-col items-center justify-center text-center">
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-3xl"
                    >
                      Chat 💬
                    </motion.div>
                    <div className="mt-2 font-semibold text-gray-800">
                      <PartyChat noteId={noteId} userId={userId} />
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      note #{noteId} • {currParty}/{maxParty}
                    </div>
                  </div>
                ) : (
                  <CommentSection key={`note-${noteId}`} noteId={noteId} userId={userId} />
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* === Dialogs === */}
      <ConfirmReplaceDialog
        open={showReplace}
        onClose={() => setShowReplace(false)}
        busy={replacing}
        onConfirm={async () => {
          try {
            setReplacing(true);
            // “แทนที่” = ลบโน้ตเดิมแล้วเข้าโหมดแต่งโพสต์ใหม่
            await handleDelete();
            setIsPosted(false);
            setText("");
            setNoteId(null);
            setIsComposing(true);
            setIsParty(false);
            setMaxParty(0);
            setCurrParty(0);
            setJoinedMemberOnly(false);
          } finally {
            setReplacing(false);
            setShowReplace(false);
          }
        }}
      />

      <ConfirmDeleteDialog
        open={showDelete}
        onClose={() => setShowDelete(false)}
        busy={deleting}
        onConfirm={async () => {
          try {
            setDeleting(true);
            await handleDelete();
          } finally {
            setDeleting(false);
            setShowDelete(false);
          }
        }}
      />
    </motion.div>
  );
}

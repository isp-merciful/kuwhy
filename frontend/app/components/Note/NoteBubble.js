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

export default function NoteBubble() {
  const localOrAuthId = useUserId();             // อาจเป็น anonymous หรือ id จริง
  const { data: session, status } = useSession(); // เอาไว้รู้ว่าล็อกอินไหม + apiToken

  const authed = status === "authenticated" && session?.user?.id;
  const userId = authed ? session.user.id : localOrAuthId;
  const apiToken = authed ? session?.apiToken : null;

  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("anonymous");
  const [isPosted, setIsPosted] = useState(false);
  const [noteId, setNoteId] = useState(null);
  const [isComposing, setIsComposing] = useState(false);
  const [editNameOnExpand, setEditNameOnExpand] = useState(false);

  // Party states
  const [isParty, setIsParty] = useState(false);
  const [maxParty, setMaxParty] = useState(0);
  const [currParty, setCurrParty] = useState(0);

  // แสดงโน้ตจากการ join (ไม่ใช่ของเรา)
  const [joinedMemberOnly, setJoinedMemberOnly] = useState(false);

  const mountedRef = useRef(true);
  const buttonEnabled = text.trim().length > 0;

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // -------------------------
  // โหลด user + note
  // -------------------------
  useEffect(() => {
    if (!userId) return;

    // reset เฉพาะ state ของ note/party (ไม่แตะ name เดิม)
    setText("");
    setNoteId(null);
    setIsPosted(false);
    setIsParty(false);
    setMaxParty(0);
    setCurrParty(0);
    setJoinedMemberOnly(false);

    const controller = new AbortController();

    // ตั้งชื่อจาก session ก่อน (ถ้าไม่ใช่ anonymous)
    if (authed && session?.user?.name && session.user.name.toLowerCase() !== "anonymous") {
      setName(session.user.name);
    }

    const extractServerName = (u) => {
      const candidate =
        u?.user_name ??
        u?.user?.user_name ??
        u?.users?.user_name ??
        u?.value?.user_name ??
        u?.name;
      return typeof candidate === "string" ? candidate : null;
    };

    async function fetchUserOnce() {
      try {
        const headers = {};
        if (apiToken) headers.Authorization = `Bearer ${apiToken}`;
        const res = await fetch(`http://localhost:8000/api/user/${userId}`, {
          signal: controller.signal,
          cache: "no-store",
          headers,
        });
        if (!mountedRef.current) return null;
        if (!res.ok) return null;
        const data = await res.json();
        if (!mountedRef.current) return null;
        return data;
      } catch {
        return null;
      }
    }

    // สร้าง user เฉพาะกรณีไม่พบ และ "ยังไม่ได้ล็อกอิน"
    async function registerUserIfAnonymous() {
      try {
        if (authed) return; // ล็อกอินอยู่ → ห้ามสร้าง anonymous
        await fetch("http://localhost:8000/api/user/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId, user_name: "anonymous" }),
          signal: controller.signal,
        });
      } catch { /* ignore */ }
    }

    async function fetchNote() {
      try {
        const headers = {};
        if (apiToken) headers.Authorization = `Bearer ${apiToken}`;
        const res = await fetch(`http://localhost:8000/api/note/user/${userId}`, {
          signal: controller.signal,
          cache: "no-store",
          headers,
        });
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
      // 1) ลองดึงผู้ใช้ก่อน
      let u = await fetchUserOnce();

      // 2) ถ้าไม่เจอ → (กรณี anonymous เท่านั้น) register แล้วดึงใหม่
      if (!u) {
        await registerUserIfAnonymous();
        u = await fetchUserOnce();
      }

      // 3) ตั้งชื่อจาก DB ถ้าดีกว่า และไม่ใช่ anonymous
      if (mountedRef.current) {
        const serverName = extractServerName(u);
        if (serverName && serverName.trim() && serverName.toLowerCase() !== "anonymous") {
          setName(serverName.trim());
        }
      }

      // 4) โหลดโน้ต
      await fetchNote();
    })();

    return () => controller.abort();
  }, [userId, authed, apiToken, session?.user?.name]);

  // -------------------------
  // Actions
  // -------------------------
  const handlePost = async () => {
    if (!text.trim()) return alert("กรุณาพิมพ์ข้อความก่อนส่ง!");
    setLoading(true);
    try {
      const payload = {
        user_id: userId, // BE จะ override ด้วย req.user.id ถ้ามี token (optionalAuth)
        message: text,
        max_party: isParty ? Math.min(20, Math.max(2, Number(maxParty) || 2)) : 0,
      };

      const headers = { "Content-Type": "application/json" };
      if (apiToken) headers.Authorization = `Bearer ${apiToken}`;

      const res = await fetch("http://localhost:8000/api/note", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (res.ok) {
        const newNoteId =
          result?.value?.note_id ?? result?.note?.note_id ?? result?.note_id;

        const serverMax =
          result?.note?.max_party ?? result?.value?.max_party ?? 0;
        const serverCurr =
          result?.note?.crr_party ?? result?.value?.crr_party ?? (serverMax > 0 ? 1 : 0);

        setNoteId(newNoteId ?? null);
        setIsPosted(true);
        setIsComposing(false);
        setIsParty((Number(serverMax) || 0) > 0);
        setMaxParty(Number(serverMax) || 0);
        setCurrParty(Number(serverCurr) || 0);
        setJoinedMemberOnly(false);
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
    if (joinedMemberOnly) {
      return alert("คุณเข้าร่วมปาร์ตี้นี้ไว้ ไม่สามารถลบโน้ตของผู้อื่นได้");
    }
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
      } else alert("ไม่สามารถลบโน้ตได้");
    } catch {
      alert("ลบไม่สำเร็จ");
    }
  };

  const handleLeaveParty = async () => {
    if (!noteId || !userId) return;
    try {
      const headers = { "Content-Type": "application/json" };
      if (apiToken) headers.Authorization = `Bearer ${apiToken}`;

      const res = await fetch("http://localhost:8000/api/note/leave", {
        method: "POST",
        headers,
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

  // -------------------------
  // UI helpers
  // -------------------------
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
                <Avatar />
                {isPosted && !joinedMemberOnly && (
                  <div className="absolute -bottom-2 -right-2 flex space-x-2">
                    <button
                      onClick={async () => {
                        await handleDelete();
                        setIsPosted(false);
                        setText("");
                        setNoteId(null);
                        setIsComposing(true);
                        setIsParty(false);
                        setMaxParty(0);
                        setCurrParty(0);
                        setJoinedMemberOnly(false);
                      }}
                      className="w-7 h-7 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center shadow"
                      title="Add New Note"
                    >
                      <PlusIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleDelete}
                      className="w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow"
                      title="Delete"
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
                  <span className={`text-gray-500 ${!isParty ? "opacity-50" : ""}`}>
                    max
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (!isParty) return;
                        setMaxParty((prev) => {
                          const n = Math.max(2, Math.min(20, Number(prev) || 2));
                          return Math.max(2, n - 1);
                        });
                      }}
                      className={`w-6 h-6 grid place-items-center rounded-md border ${
                        isParty ? "hover:bg-white" : "opacity-50 cursor-not-allowed"
                      }`}
                      disabled={!isParty}
                      aria-label="ลดจำนวน"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min={2}
                      max={20}
                      step={1}
                      value={isParty ? (Number(maxParty) || 2) : 0}
                      onChange={(e) => {
                        if (!isParty) return;
                        let v = Math.floor(Math.abs(Number(e.target.value) || 0));
                        if (v < 2) v = 2;
                        if (v > 20) v = 20;
                        setMaxParty(v);
                      }}
                      className="w-12 text-center bg-transparent outline-none border rounded-md py-0.5"
                      disabled={!isParty}
                      aria-label="จำนวนสมาชิกสูงสุด"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!isParty) return;
                        setMaxParty((prev) => {
                          const n = Math.max(2, Math.min(20, Number(prev) || 2));
                          return Math.min(20, n + 1);
                        });
                      }}
                      className={`w-6 h-6 grid place-items-center rounded-md border ${
                        isParty ? "hover:bg-white" : "opacity-50 cursor-not-allowed"
                      }`}
                      disabled={!isParty}
                      aria-label="เพิ่มจำนวน"
                    >
                      +
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
                Party can be held with 2–20 people (including yourself).
              </motion.p>
            )}

            {/* ส่วนล่าง */}
            {isPosted && noteId && (
              <div className="w-full bg-white rounded-xl p-4 mt-4 shadow-inner flex-1 overflow-y-auto">
                {isParty && maxParty > 0 ? (
                  <div className="h-60 flex flex-col items-center justify-center text-center">
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-3xl">Chat 💬</motion.div>
                    <div className="mt-2 font-semibold text-gray-800">
                      <PartyChat noteId={noteId} userId={userId} />
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      note #{noteId} • {currParty}/{maxParty} คน
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
    </motion.div>
  );
}

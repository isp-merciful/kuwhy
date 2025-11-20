// frontend/app/components/NoteBubble.js
"use client";

import {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams, useRouter, usePathname } from "next/navigation"; // ✅ เพิ่มตรงนี้

import MessageInput from "./MessageInput";
import Avatar from "./Avatar";
import UserNameEditor from "./UserNameEditor";
import CommentSection from "./CommentSection";
import { TrashIcon, PlusIcon } from "@heroicons/react/24/outline";
import PartyChat from "./PartyChat";
import useUserId from "./useUserId";
import ConfirmDeleteDialog from "./ConfirmDeleteDialog";
import ConfirmReplaceDialog from "./ConfirmReplaceDialog";
import ConfirmLeaveDialog from "./ConfirmLeaveDialog"; //
const MAX_NOTE_CHARS = 60;
const WARNING_THRESHOLD = 55;

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

  // ✅ hooks สำหรับอ่าน query / จัดการ URL
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname(); // ควรเป็น "/note"

  // --- user id: ตรึงให้เสถียร ---
  const localOrAuthId = useUserId();
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
  const [showLeave, setShowLeave] = useState(false);   
  const [leaving, setLeaving] = useState(false);      
  // --- party states ---
  const [isParty, setIsParty] = useState(false);
  const [maxParty, setMaxParty] = useState(0);
  const [currParty, setCurrParty] = useState(0);
  const [joinedMemberOnly, setJoinedMemberOnly] = useState(false);

  // toast สำหรับ login
  const [showLoginToast, setShowLoginToast] = useState(false);

  const toggleParty = () => {
    setIsParty((prev) => {
      const next = !prev;

      setMaxParty((old) => {
        if (!next) return 0;
        const base = Number(old) || 2;
        return Math.max(2, Math.min(20, base));
      });

      return next;
    });
  };

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const buttonEnabled = text.trim().length > 0;

  // helper สำหรับ limit ตัวอักษร
  const handleChangeText = (value) => {
    if (typeof value !== "string") return;
    setText(value.slice(0, MAX_NOTE_CHARS));
  };

  const charCount = text.length;
  const showCharWarning = isComposing && charCount >= WARNING_THRESHOLD;

  // ✅ อ่าน query `openCompose` จาก URL แล้วเปิด composing
  useEffect(() => {
    const openCompose = searchParams.get("openCompose");
    if (openCompose === "1") {
      // เปิดโหมด compose
      setIsComposing(true);

      // เคลียร์ query ออกจาก URL ให้สะอาด (กันเปิดซ้ำ)
      const params = new URLSearchParams(searchParams.toString());
      params.delete("openCompose");
      const newQuery = params.toString();
      const newUrl = newQuery ? `${pathname}?${newQuery}` : pathname;

      router.replace(newUrl, { scroll: false });
    }
  }, [searchParams, pathname, router]);

  // toast auto-hide
  useEffect(() => {
    if (!showLoginToast) return;
    const t = setTimeout(() => setShowLoginToast(false), 4000);
    return () => clearTimeout(t);
  }, [showLoginToast]);

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
  // refresh note จาก server (ใช้ได้ทั้งตอน mount และตอน popup join event)
  // --------------------------
  const refreshNote = useCallback(
    async (signal) => {
      if (!userId) return;

      try {
        const options = {
          cache: "no-store",
          headers: { ...authHeaders },
        };
        if (signal) options.signal = signal;

        const res = await fetch(
          `http://localhost:8000/api/note/user/${userId}`,
          options
        );
        if (!mountedRef.current) return;

        if (!res.ok) {
          // ไม่มี note
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
          setText((data?.message ?? "").slice(0, MAX_NOTE_CHARS));
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
      } catch (err) {
        if (!mountedRef.current) return;
        if (err.name === "AbortError") return;

        setIsPosted(false);
        setNoteId(null);
        setText("");
        setIsParty(false);
        setMaxParty(0);
        setCurrParty(0);
        setJoinedMemberOnly(false);
      }
    },
    [userId, authHeaders]
  );

  // --------------------------
  // initial load (profile + note)
  // --------------------------
  useEffect(() => {
    if (!userId || !ready) return;

    // reset note/party states
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

    async function fetchUserOnce(signal) {
      try {
        const options = {
          cache: "no-store",
          headers: { ...authHeaders },
        };
        if (signal) options.signal = signal;

        const res = await fetch(
          `http://localhost:8000/api/user/${userId}`,
          options
        );
        if (!mountedRef.current || !res.ok) return null;
        const data = await res.json();
        if (!mountedRef.current) return null;
        return data;
      } catch (err) {
        if (err.name === "AbortError") return null;
        return null;
      }
    }

    (async () => {
      const u = await fetchUserOnce(controller.signal);
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

      await refreshNote(controller.signal);
    })();

    return () => controller.abort();
  }, [userId, ready, authed, session?.user?.name, authHeaders, refreshNote]);

  // --------------------------
  // ฟัง event จาก Popup: join party แล้วให้รีเฟรช note ทันที
  // --------------------------
  useEffect(() => {
    if (!userId) return;
    if (typeof window === "undefined") return;

    const handler = (e) => {
      const detail = e.detail || {};
      // ถ้าจะกรอง userId ก็ทำแบบนี้ได้ (ตอนนี้ปล่อยให้รีเฟรชทุกครั้งที่มี event)
      // if (detail.userId && String(detail.userId) !== String(userId)) return;

      refreshNote();
    };

    window.addEventListener("kuwhy-active-note-changed", handler);
    return () =>
      window.removeEventListener("kuwhy-active-note-changed", handler);
  }, [userId, refreshNote]);

  // --------------------------
  // Actions
  // --------------------------
  const handlePost = async () => {
    if (!ready)
      return alert("กำลังตรวจสอบสถานะผู้ใช้… ลองใหม่อีกครั้ง");
    if (!userId) return alert("ไม่พบผู้ใช้ กรุณารีเฟรชหน้า");
    if (!text.trim()) return alert("กรุณาพิมพ์ข้อความก่อนส่ง!");

    if (isParty && !authed) {
      setShowLoginToast(true);
      return;
    }

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
          result?.value?.note_id ??
          result?.note?.note_id ??
          result?.note_id;

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
      return alert(
        "You have joined this party and cannot delete other people's notes."
      );
    try {
      const res = await fetch(
        `http://localhost:8000/api/note/${noteId}`,
        {
          method: "DELETE",
        }
      );
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

  // (PartySwitch ยังเก็บไว้เผื่อใช้ต่อในอนาคต)
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
              setText={handleChangeText}
              isPosted={isPosted}
              isCompose={false}
              variant="collapsed"
              showButton={false}
            />

            <div className="relative mt-4">
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
            className="w-full flex flex-col items-center justify-center relative px-4 pt-16 pb-8"
          >
            {/* Back button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsComposing(false);
              }}
              className="absolute top-4 left-4 z-30 inline-flex h-9 items-center justify-center gap-2 px-4 rounded-full bg-white/90 border border-gray-200 shadow-sm text-gray-700 hover:bg-white hover:text-gray-900 active:scale-95 pointer-events-auto"
            >
              <span className="text-base leading-none">←</span>
              <span className="text-sm font-medium">Back</span>
            </button>

            {/* main layout: ซ้าย = note, ขวา = comments / party chat */}
            <div
              className={`w-full flex ${
                isPosted && noteId
                  ? "max-w-5xl flex-col md:flex-row md:items-start md:gap-4 gap-2"
                  : "max-w-md flex-col items-center gap-6"
              }`}
            >
              {/* LEFT COLUMN */}
              <div className="flex flex-col items-center w-full md:w-[35%] max-w-sm">
                {/* Input */}
                <MessageInput
                  text={text}
                  setText={handleChangeText}
                  isPosted={isPosted}
                  handlePost={handlePost}
                  loading={loading}
                  variant="compose"
                  showButton={false}
                  isCompose={true}
                />

                {/* char counter */}
                <div className="mt-2 min-h-[1rem] flex items-center justify-end w-full max-w-xs mx-auto pr-2">
                  {showCharWarning && !isPosted && (
                    <span className="text-xs font-semibold text-red-500">
                      {charCount}/{MAX_NOTE_CHARS}
                    </span>
                  )}
                </div>

                {/* Avatar + FAB */}
                <div className="-mt-3 mb-2 relative inline-block">
                  <Avatar
                    src={serverImg || undefined}
                    onUrlReady={!serverImg ? handleAvatarUrlReady : undefined}
                  />
                  {isPosted && !joinedMemberOnly && (
                    <div className="absolute -bottom-2 -right-2 flex space-x-2">
                      <button
                        onClick={() => setShowReplace(true)}
                        className="w-7 h-7 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center shadow"
                        title="Add New Note"
                      >
                        <PlusIcon className="w-5 h-5" />
                      </button>
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

                {/* ชื่อผู้ใช้ */}
                <UserNameEditor
                  name={name}
                  setName={setName}
                  isPosted={isPosted}
                  editNameOnExpand={editNameOnExpand}
                  setEditNameOnExpand={setEditNameOnExpand}
                  onEditClick={null}
                />

                {/* ปุ่มโพสต์ + toast */}
                {!isPosted && (
                  <div className="mt-4 relative flex flex-col items-center">
                    <button
                      onClick={handlePost}
                      disabled={!buttonEnabled || loading}
                      className={`px-6 py-2 rounded-full text-white transition ${
                        buttonEnabled
                          ? "bg-[#2FA2FF] hover:bg-[#1d8de6]"
                          : "bg-gray-300 cursor-not-allowed"
                      }`}
                    >
                      Post
                    </button>

                    <AnimatePresence>
                      {showLoginToast && (
                        <motion.div
                          key="login-toast"
                          initial={{ opacity: 0, y: 4, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 4, scale: 0.98 }}
                          transition={{ duration: 0.18 }}
                          className="absolute bottom-full mb-2 z-20"
                        >
                          <div className="flex items-center gap-2 bg-white/95 text-sky-800 text-[11px] sm:text-xs px-3 py-1.5 rounded-full shadow-md border border-sky-100">
                            <span className="font-medium whitespace-nowrap">
                              Please sign in to create a party.
                            </span>

                            <a
                              href="/login"
                              onClick={() => setShowLoginToast(false)}
                              className="text-[11px] sm:text-xs font-semibold underline underline-offset-2"
                            >
                              Login
                            </a>

                            <button
                              type="button"
                              onClick={() => setShowLoginToast(false)}
                              className="text-[11px] sm:text-xs opacity-70 hover:opacity-100"
                            >
                              Close
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
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
                    <div className="flex items-center justify-between gap-4 bg-white/90 border border-sky-100 rounded-2xl px-4 py-2 shadow-sm">
                      {/* SLIDER BUTTON */}
                      <button
                        type="button"
                        aria-pressed={isParty}
                        onClick={toggleParty}
                        className={`relative flex items-center justify-center w-[190px] h-10 rounded-full overflow-hidden transition-all duration-300 ease-out ${
                          isParty
                            ? "bg-gradient-to-r from-emerald-400 to-green-500 shadow-md"
                            : "bg-gradient-to-r from-sky-400 to-blue-500 shadow-md"
                        } active:scale-[0.97]`}
                      >
                        <span
                          className={`relative z-10 select-none text-white text-sm sm:text-base font-medium transition-transform duration-300 inline-flex items-center pl-7 ${
                            isParty ? "-translate-x-3" : "translate-x-0"
                          }`}
                        >
                          {isParty ? "Woo!" : "Create party"}
                        </span>

                        <span
                          className={`absolute inset-y-1 left-1 flex items-center transition-transform duration-300 ease-out ${
                            isParty ? "translate-x-[148px]" : "translate-x-0"
                          }`}
                        >
                          <span
                            className={`h-8 w-8 rounded-full bg-white flex items-center justify-center shadow-sm ring-[3px] ${
                              isParty ? "ring-emerald-500" : "ring-sky-400"
                            }`}
                          >
                            <span
                              className={`text-lg font-semibold leading-none ${
                                isParty
                                  ? "text-emerald-600"
                                  : "text-sky-500"
                              }`}
                            >
                              {isParty ? "✓" : ">"}
                            </span>
                          </span>
                        </span>
                      </button>

                      {/* PARTY SIZE */}
                      <div className="relative flex items-center gap-1 pr-1">
                        <span
                          className={`absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] sm:text-[8px] font-medium tracking-wide ${
                            isParty ? "text-gray-600" : "text-gray-400"
                          }`}
                        >
                          Party size
                        </span>

                        <button
                          type="button"
                          onClick={() => {
                            if (!isParty) return;
                            setMaxParty((prev) => {
                              const n = Math.max(
                                2,
                                Math.min(20, Number(prev) || 2)
                              );
                              return Math.max(2, n - 1);
                            });
                          }}
                          disabled={!isParty}
                          aria-label="ลดจำนวน"
                          className={`w-7 h-7 grid place-items-center rounded-md border text-xs transition-all duration-150 ${
                            isParty
                              ? "bg-white hover:bg-sky-50 active:scale-95 border-gray-200 text-gray-700"
                              : "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                          }`}
                        >
                          −
                        </button>

                        <div
                          className={`min-w-[2.1rem] h-7 grid place-items-center rounded-md text-xs font-medium border bg-white transition-colors duration-150 ${
                            isParty
                              ? "border-emerald-300 text-gray-800"
                              : "border-gray-200 text-gray-400"
                          }`}
                        >
                          {isParty
                            ? Math.max(
                                2,
                                Math.min(20, Number(maxParty) || 2)
                              )
                            : 0}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (!isParty) return;
                            setMaxParty((prev) => {
                              const n = Math.max(
                                2,
                                Math.min(20, Number(prev) || 2)
                              );
                              return Math.min(20, n + 1);
                            });
                          }}
                          disabled={!isParty}
                          aria-label="เพิ่มจำนวน"
                          className={`w-7 h-7 grid place-items-center rounded-md border text-xs transition-all duration-150 ${
                            isParty
                              ? "bg-sky-500 text-white hover:bg-sky-600 active:scale-95 border-sky-500"
                              : "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                          }`}
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
                         onClick={() => setShowLeave(true)} 
                        className="text-sm px-3 py-1 rounded-full border border-red-300 text-red-600 hover:bg-red-50"
                      >
                        Leave
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN – Comment / PartyChat */}
              {isPosted && noteId && (
                <div className="w-full md:w-[60%] mt-6 md:mt-2">
                  <div className="w-full max-w-2xl bg-white/80 backdrop-blur-sm rounded-[28px] px-6 py-5 shadow-[0_18px_40px_rgba(15,23,42,0.12)] mx-auto">
                    {isParty && maxParty > 0 ? (
                      <div className="flex flex-col items-stretch">
                        <PartyChat noteId={noteId} userId={userId} />
                        <div className="mt-3 text-center text-xs text-gray-400">
                          note #{noteId} • {currParty}/{maxParty}
                        </div>
                      </div>
                    ) : (
                      <CommentSection
                        key={`note-${noteId}`}
                        noteId={noteId}
                        userId={userId}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* คำอธิบาย */}
            {!isPosted && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="text-gray-500 text-sm mt-4 text-center max-w-xl mx-auto leading-relaxed"
              >
                <span className="block">
                  Share quick notes or start a party.
                </span>
                <span className="block">
                  Notes disappear in 24 hours. Log in to host.
                </span>
              </motion.p>
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
      
        <ConfirmLeaveDialog
        open={showLeave}
        onClose={() => setShowLeave(false)}
        busy={leaving}
        onConfirm={async () => {
          try {
            setLeaving(true);
            await handleLeaveParty();   // ใช้ฟังก์ชันเดิม ทั้ง reset state/API
          } finally {
            setLeaving(false);
            setShowLeave(false);
          }
        }}
      />
    </motion.div>
  );
}

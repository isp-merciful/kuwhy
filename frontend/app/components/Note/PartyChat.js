"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";
import ReportDialog from "../ReportDialog";

const API = "http://localhost:8000/api";

/* ---------- utils ---------- */

function formatClock(time) {
  if (!time) return "";
  const d = new Date(time);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function cx(...xs) {
  return xs.filter(Boolean).join(" ");
}

const PROFILE_BASE = process.env.NEXT_PUBLIC_PROFILE_BASE || "/profile";
function buildProfileUrl(handle) {
  if (!handle) return "/";
  if (PROFILE_BASE === "root") return `/${handle}`;
  if (PROFILE_BASE === "@root") return `/@${handle}`;
  return `${PROFILE_BASE}/${handle}`;
}

function Bubble({ mine, name, img, text, time, loginName, noteId, messageId }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showReport, setShowReport] = useState(false);

  const handle = loginName || "";
  const displayName = name || "anonymous";

  const canOpenProfile =
    !!handle && String(handle).toLowerCase() !== "anonymous";

  const goProfile = () => {
    if (!canOpenProfile) return;
    try {
      const url = buildProfileUrl(handle);
      router.push(url);
    } catch (err) {
      console.warn("navigate profile failed:", err);
    }
  };

  const avatarSrc = img || "/images/pfp.png";

  useEffect(() => {
    const onDoc = (e) => {
      if (
        !e.target.closest ||
        !e.target.closest(`[data-menu-anchor="party-${messageId}"]`)
      ) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, [messageId]);

  return (
    <>
      <div
        className={`flex items-end gap-2 ${
          mine ? "justify-end" : "justify-start"
        }`}
      >
        {!mine && (
          <button
            type="button"
            onClick={goProfile}
            className={cx(
              "shrink-0 focus:outline-none",
              canOpenProfile ? "cursor-pointer" : "cursor-default"
            )}
            title={canOpenProfile ? `@${handle}` : undefined}
            aria-label={canOpenProfile ? `Open @${handle}` : undefined}
          >
            <img
              src={avatarSrc}
              alt={displayName}
              className="w-8 h-8 rounded-full object-cover ring-1 ring-black/5"
              onError={(e) => {
                if (e.currentTarget.src !== "/images/pfp.png") {
                  e.currentTarget.src = "/images/pfp.png";
                }
              }}
            />
          </button>
        )}

        <div
          className={`flex flex-col max-w-[70%] ${
            mine ? "items-end" : "items-start"
          }`}
        >
          {!mine &&
            (canOpenProfile ? (
              <button
                type="button"
                onClick={goProfile}
                className="text-xs font-semibold text-slate-500 mb-0.5 text-left hover:underline focus:outline-none"
                title={`@${handle}`}
              >
                {displayName}
              </button>
            ) : (
              <span className="text-xs font-semibold text-slate-500 mb-0.5 text-left">
                {displayName}
              </span>
            ))}

          <div className="relative flex items-end gap-1 group">
            {/* bubble */}
            <div
              className={[
                "px-3 py-2 rounded-2xl text-sm leading-relaxed",
                "whitespace-pre-wrap break-words break-all",
                mine
                  ? "bg-sky-500 text-white rounded-br-md shadow-sm"
                  : "bg-slate-100 text-slate-900 rounded-bl-md shadow-sm",
              ].join(" ")}
            >
              {text}
            </div>

            {time && (
              <div
                className={`text-[10px] self-end ${
                  mine ? "text-sky-200" : "text-slate-400"
                }`}
              >
                {formatClock(time)}
              </div>
            )}

            <div
              data-menu-anchor={`party-${messageId}`}
              className={cx(
                "absolute -top-2",
                mine ? "right-0" : "left-0",
                "opacity-0 pointer-events-none",
                "group-hover:opacity-100 group-hover:pointer-events-auto",
                "transition"
              )}
            >
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="rounded-full p-1 bg-white shadow-sm ring-1 ring-gray-300 hover:bg-gray-50"
                aria-label="More"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3.5 w-3.5 text-gray-600"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </button>

              {menuOpen && (
                <div className="mt-1 w-28 rounded-xl bg-white shadow-lg ring-1 ring-black/5 overflow-hidden text-xs">
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left text-amber-600 hover:bg-amber-50"
                    onClick={() => {
                      setMenuOpen(false);
                      setShowReport(true);
                    }}
                  >
                    Report
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showReport && (
        <ReportDialog
          targetType="party_chat"
          targetId={messageId}
          onClose={() => setShowReport(false)}
        />
      )}
    </>
  );
}

/* ---------- main component ---------- */

export default function PartyChat({ noteId, userId }) {
  const { data: session, status } = useSession();
  const ready = status === "authenticated" && !!session?.apiToken;

  const [messages, setMessages] = useState([]);
  const [memberInfo, setMemberInfo] = useState(null); 
  const [pending, setPending] = useState(false);
  const [text, setText] = useState("");
  const [netErr, setNetErr] = useState("");

  const listRef = useRef(null); 
  const cursorRef = useRef(0);

  const authFetch = useCallback(
    (url, options = {}) =>
      fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {}),
          ...(session?.apiToken
            ? { Authorization: `Bearer ${session.apiToken}` }
            : {}),
        },
        cache: "no-store",
      }),
    [session?.apiToken]
  );

  useEffect(() => {
    if (!noteId) return;

    let alive = true;

    async function fetchMembers() {
      try {
        const res = await authFetch(`${API}/note/${noteId}/members`);
        if (!alive || !res.ok) return;
        const data = await res.json();
        if (!data.ok) return;

        const host = data.host || null;
        const members = Array.isArray(data.members) ? data.members : [];
        if (alive) setMemberInfo({ host, members });
      } catch (err) {
        console.error("[PartyChat] fetch members error:", err);
      }
    }

    fetchMembers();
    const iv = setInterval(fetchMembers, 15000);

    return () => {
      alive = false;
      clearInterval(iv);
    };
  }, [noteId, authFetch]);

  useEffect(() => {
    if (!noteId) return;

    let alive = true;
    let iv;

    async function fetchMore() {
      if (!alive || !ready) return;
      try {
        const res = await authFetch(
          `${API}/chat/party/${noteId}?cursor=${cursorRef.current}&limit=50`
        );
        if (!alive || !res.ok) return;

        const data = await res.json();
        const incoming = Array.isArray(data.messages) ? data.messages : [];
        if (!incoming.length) return;

        setMessages((prev) => {
          const merged = [...prev, ...incoming];
          const last = merged[merged.length - 1];
          if (last) cursorRef.current = last.message_id;
          return merged;
        });
      } catch {
        if (alive) setNetErr("Network problem");
      }
    }

    setMessages([]);
    cursorRef.current = 0;
    setNetErr("");

    fetchMore();
    iv = setInterval(fetchMore, 3000);

    return () => {
      alive = false;
      clearInterval(iv);
    };
  }, [noteId, ready, authFetch]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  async function send() {
    const content = String(text || "").trim();
    if (!content || !ready) return;

    setPending(true);
    setNetErr("");

    try {
      const res = await authFetch(`${API}/chat/party/${noteId}`, {
        method: "POST",
        body: JSON.stringify({ content }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(data?.error || "Send failed");
      } else if (data?.value) {
        setMessages((prev) => [...prev, data.value]);
        cursorRef.current = data.value.message_id;

        try {
          if (userId) {
            await fetch(`${API}/noti`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                sender_id: userId,
                note_id: Number(noteId),
                event_type: "party_chat",
              }),
            });
          }
        } catch (e) {
          console.error("send party_chat notification failed:", e);
        }
      }
    } catch {
      alert("ไม่สามารถเชื่อมต่อ server ได้");
    } finally {
      setPending(false);
      setText("");
    }
  }


  const { roomTitle, subtitle, hostAvatar, memberAvatars } = useMemo(() => {
    const host = memberInfo?.host || null;
    const members = memberInfo?.members || [];

    const roomTitle = host?.user_name
      ? `${host.user_name}'s Party`
      : "Party Chat";

    const total = (host ? 1 : 0) + members.length;
    const subtitle =
      total > 0
        ? `${total} member${total === 1 ? "" : "s"} in this party`
        : "No one has joined this party yet";

    const hostAvatar = {
      src: host?.img || "/images/pfp.png",
      alt: host?.user_name || "host",
    };

    const memberAvatars = members.slice(0, 3).map((m) => ({
      key: m.user_id || m.id || m.email,
      src: m.img || "/images/pfp.png",
      alt: m.user_name || "member",
    }));

    return { roomTitle, subtitle, hostAvatar, memberAvatars };
  }, [memberInfo]);

  /* ---------- LAYOUT: header fixed + list scroll-only + input fixed ---------- */

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col">
      {/* HEADER */}
      <div className="pb-3 border-b border-slate-100">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center -space-x-2">
              <div className="relative h-9 w-9 rounded-full ring-2 ring-white overflow-hidden shadow-md">
                <img
                  src={hostAvatar.src}
                  alt={hostAvatar.alt}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    if (e.currentTarget.src !== "/images/pfp.png") {
                      e.currentTarget.src = "/images/pfp.png";
                    }
                  }}
                />
              </div>
              {memberAvatars.map((m) => (
                <div
                  key={m.key}
                  className="relative h-7 w-7 rounded-full ring-2 ring-white overflow-hidden shadow-md"
                >
                  <img
                    src={m.src}
                    alt={m.alt}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      if (e.currentTarget.src !== "/images/pfp.png") {
                        e.currentTarget.src = "/images/pfp.png";
                      }
                    }}
                  />
                </div>
              ))}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-base font-semibold text-slate-900 truncate">
                  {roomTitle}
                </span>
                <ChatBubbleLeftRightIcon className="w-4 h-4 text-slate-300" />
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                {subtitle}
              </div>
            </div>
          </div>

          {ready && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] text-emerald-600">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              live
            </span>
          )}
        </div>
      </div>

      {/* MESSAGE LIST */}
      <div
        ref={listRef}
        className="mt-3 mb-3 pr-1 space-y-3 max-h-[260px] overflow-y-auto overflow-x-hidden"
      >
        {!ready && (
          <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 text-center">
            Please sign in to view and send messages.
          </div>
        )}

        {ready && messages.length === 0 && (
          <div className="text-sm text-gray-400 text-center mt-2">
            No messages yet, feel free to start!
          </div>
        )}

        {ready &&
          messages.map((m) => (
            <Bubble
              key={m.message_id}
              mine={String(m.user_id) === String(userId)}
              name={m.user_name}
              img={m.img}
              text={m.content}
              time={m.created_at}
              loginName={m.login_name} 
              noteId={noteId}
              messageId={m.message_id}
            />
          ))}
      </div>

      {/* INPUT */}
      <div className="pt-1">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => {
              const noNewline = e.target.value.replace(/[\r\n]+/g, " ");
              setText(noNewline);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                send();
              }
            }}
            onPaste={(e) => {
              e.preventDefault();
              const pasted = (e.clipboardData || window.clipboardData).getData(
                "text"
              );
              const oneLine = pasted.replace(/[\r\n]+/g, " ");
              setText((prev) => (prev + " " + oneLine).trim());
            }}
            placeholder={ready ? "Aa" : "Sign in to chat"}
            disabled={!ready}
            className="flex-1 border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-400 disabled:bg-gray-100"
          />
          <button
            onClick={send}
            disabled={pending || !text.trim() || !ready}
            className={`px-4 py-2 rounded-full text-white text-sm font-medium transition ${
              text.trim() && !pending && ready
                ? "bg-sky-500 hover:bg-sky-600"
                : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            send
          </button>
        </div>

        {netErr && (
          <div className="mt-1 text-[11px] text-center text-slate-400">
            {netErr}
          </div>
        )}
      </div>
    </div>
  );
}

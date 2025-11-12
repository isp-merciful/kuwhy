// frontend/app/components/Popup.js
"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { XMarkIcon, UsersIcon } from "@heroicons/react/24/outline";
import { SparklesIcon } from "@heroicons/react/24/solid";
import CommentSection from "./CommentSection";

export default function Popup({
  showPopup,
  setShowPopup,
  noteId,
  text,
  name,
  maxParty = 0,
  currParty = 0,
  ownerId,
  viewerUserId,
}) {
  const { data: session, status } = useSession();
  const authed = status === "authenticated" && !!session?.apiToken;

  const search = useSearchParams();
  const router = useRouter();

  // ===== state =====
  const [joined, setJoined] = useState(false);
  const [joining, setJoining] = useState(false);
  const [curr, setCurr] = useState(Number(currParty) || 0);
  const [max, setMax] = useState(Number(maxParty) || 0);

  // cross-party / own-note restrictions
  const [alreadyInAnotherParty, setAlreadyInAnotherParty] = useState(false);
  const [currentPartyId, setCurrentPartyId] = useState(null);
  const [hasOwnNote, setHasOwnNote] = useState(false);
  const [ownNoteId, setOwnNoteId] = useState(null);

  // avatars
  const [hostPfp, setHostPfp] = useState(null);
  const [members, setMembers] = useState([]); // [{ user_id, user_name, img }]
  const [loadingMembers, setLoadingMembers] = useState(false);

  // toast
  const [toast, setToast] = useState(null); // { type: 'info'|'error'|'success', text: string }

  const isParty = max > 0;
  const isFull = isParty && max > 0 && curr >= max;
  const memberWord = curr === 1 ? "member" : "members";

  const crazyLabel = useMemo(() => {
    const labels = [
      "Crazy Idea",
      "Let’s Go!",
      "Instant Plan",
      "Just Vibe",
      "Go For It!",
      "Now or Never!",
      "Vibe & Thrive",
    ];
    return labels[Math.floor(Math.random() * labels.length)];
  }, [noteId]);

  const partyTitle = `${name || "anonymous"}'s Party`;
  const noteTitle = `${name || "anonymous"}'s note`;

  const showToast = (text, type = "error", timeout = 2800) => {
    setToast({ text, type });
    if (timeout > 0) setTimeout(() => setToast(null), timeout);
  };

  const authHeaders = useMemo(
    () => (authed ? { Authorization: `Bearer ${session.apiToken}` } : {}),
    [authed, session?.apiToken]
  );

  async function fetchJson(url, options = {}) {
    const res = await fetch(url, options);
    let data = null;
    try {
      data = await res.json();
    } catch {}
    return { ok: res.ok, status: res.status, data };
  }

  // viewer is host => already joined
  useEffect(() => {
    if (!showPopup) return;
    if (ownerId && viewerUserId && String(ownerId) === String(viewerUserId)) {
      setJoined(true);
    }
  }, [showPopup, ownerId, viewerUserId]);

  // must not have own note / other party
  useEffect(() => {
    if (!showPopup || !viewerUserId) return;
    (async () => {
      try {
        const resp = await fetch(`http://localhost:8000/api/note/user/${viewerUserId}`, {
          headers: { ...authHeaders }, cache: "no-store",
        });
        const raw = await resp.json().catch(() => null);
        const n = raw && typeof raw === "object" ? (raw.note ?? raw) : null;

        if (n && n.note_id) {
          setHasOwnNote(true);
          setOwnNoteId(n.note_id);
          if (Number(n.max_party) > 0 && Number(n.note_id) !== Number(noteId)) {
            setAlreadyInAnotherParty(true);
            setCurrentPartyId(n.note_id);
          }
        } else {
          setHasOwnNote(false);
          setOwnNoteId(null);
        }
      } catch {}
    })();
  }, [showPopup, viewerUserId, authHeaders, noteId]);

  // load members + derive joined
  useEffect(() => {
    if (!showPopup) return;
    (async () => {
      if (!isParty || !noteId) { setMembers([]); return; }
      setLoadingMembers(true);
      try {
        const resp = await fetch(`http://localhost:8000/api/note/${noteId}/members`, {
          headers: { ...authHeaders }, cache: "no-store",
        });
        const data = await resp.json().catch(() => ({}));

        if (resp.ok && data && Array.isArray(data.members)) {
          setHostPfp(data?.host?.img || null);
          if (typeof data?.crr_party === "number") setCurr(Number(data.crr_party));
          if (typeof data?.max_party === "number") setMax(Number(data.max_party));
          const norm = data.members.map((m) => ({
            user_id: m.user_id, user_name: m.user_name || "anonymous", img: m.img || null,
          }));
          setMembers(norm);

          const viewerId = viewerUserId ? String(viewerUserId) : null;
          const hostJoined = viewerId && data?.host?.user_id && String(data.host.user_id) === viewerId;
          const inMembers  = viewerId && norm.some((m) => String(m.user_id) === viewerId);
          if (hostJoined || inMembers) setJoined(true);
        } else {
          setMembers([]);
        }
      } finally { setLoadingMembers(false); }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showPopup, isParty, noteId]);

  // auto-join via ?autoJoin=1
  useEffect(() => {
    const autoJoin = search.get("autoJoin") === "1";
    if (!autoJoin || !isParty || joined || !noteId) return;
    if (!authed) return;

    (async () => {
      try {
        const res = await fetch("http://localhost:8000/api/note/join", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders },
          body: JSON.stringify({ note_id: Number(noteId) }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok || data?.error === "already joined") {
          setJoined(true);
          if (typeof data?.data?.crr_party === "number") setCurr(Number(data.data.crr_party));
          if (typeof data?.data?.max_party === "number") setMax(Number(data.data.max_party));
        } else {
          if (data?.error_code === "ALREADY_IN_PARTY") {
            setAlreadyInAnotherParty(true);
            setCurrentPartyId(data?.current_note_id ?? null);
            showToast("You are already in another party. Leave it first.", "info");
          } else if (data?.error_code === "PARTY_FULL") {
            showToast("Party is full", "error");
          } else {
            showToast((data?.error || "Join failed").toString(), "error");
          }
        }
      } catch { showToast("Cannot join party right now", "error"); }
      finally {
        try {
          const url = new URL(window.location.href);
          url.searchParams.delete("autoJoin");
          router.replace(url.pathname + (url.search ? "?" + url.searchParams.toString() : ""));
        } catch {}
      }
    })();
  }, [search, isParty, joined, noteId, authed, authHeaders, router]);

  async function handleJoin() {
    if (!noteId || !isParty || joined || joining) return;

    if (hasOwnNote && Number(ownNoteId) !== Number(noteId)) {
      showToast("You already have your own note. Replace or delete it first.", "info"); return;
    }
    if (alreadyInAnotherParty && Number(currentPartyId) !== Number(noteId)) {
      showToast("You are already in another party. Leave it first.", "info"); return;
    }
    if (!authed) { showToast("Please sign in to join this party.", "info"); return; }
    if (curr >= max) { showToast("Party is full", "error"); return; }

    try {
      setJoining(true);
      const res = await fetch("http://localhost:8000/api/note/join", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ note_id: Number(noteId) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok && data?.error !== "already joined") {
        if (data?.error_code === "ALREADY_IN_PARTY") {
          setAlreadyInAnotherParty(true);
          setCurrentPartyId(data?.current_note_id ?? null);
          showToast("You are already in another party. Leave it first.", "info"); return;
        }
        if (data?.error_code === "PARTY_FULL") { showToast("Party is full", "error"); return; }
        showToast((data?.error || "Join failed").toString(), "error"); return;
      }
      setJoined(true);
      if (typeof data?.data?.crr_party === "number") setCurr(Number(data.data.crr_party));
      if (typeof data?.data?.max_party === "number") setMax(Number(data.data.max_party));
      showToast("Joined party 🎉", "success");

      try {
        const m = await fetchJson(`http://localhost:8000/api/note/${noteId}/members`, {
          headers: { ...authHeaders }, cache: "no-store",
        });
        if (m.ok && m.data && Array.isArray(m.data.members)) {
          const norm = m.data.members.map((x) => ({
            user_id: x.user_id ?? x.id ?? x.uid,
            user_name: x.user_name ?? x.name ?? "anonymous",
            img: x.img ?? x.picture ?? null,
          }));
          setMembers(norm);
          if (typeof m.data?.crr_party === "number") setCurr(Number(m.data.crr_party));
          if (typeof m.data?.max_party === "number") setMax(Number(m.data.max_party));
        }
      } catch {}
    } finally { setJoining(false); }
  }

  const canShowCTA =
    isParty && !joined && !isFull &&
    !alreadyInAnotherParty &&
    !(hasOwnNote && Number(ownNoteId) !== Number(noteId));

  return (
    <AnimatePresence>
      {showPopup && (
        <motion.div
          key="party-popup"
          initial={{ opacity: 0, scale: 0.98, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 6 }}
          transition={{ type: "spring", stiffness: 280, damping: 26 }}
          className="relative w-[min(92vw,560px)] rounded-2xl bg-white shadow-2xl ring-1 ring-black/5"
        >
          {/* close */}
          <button
            onClick={() => setShowPopup(false)}
            className="absolute right-3 top-3 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>

          {/* ===== TOP BUBBLE ===== */}
          <div className="px-6 pt-6 pb-0">
            <div className="flex justify-center">
              {isParty ? (
                // PARTY: label + message ในก้อนเดียว (ดำ)
                <div className="relative text-center">
                  <div className="inline-block rounded-[18px] bg-neutral-900 text-white px-5 py-3 shadow-md">
                    <div className="flex items-center justify-center gap-2 text-[13px] font-semibold text-fuchsia-300">
                      <SparklesIcon className="h-4 w-4" />
                      <span>{crazyLabel}</span>
                    </div>
                    <div className="mt-1 text-[17px] md:text-[18px] font-semibold leading-snug break-words text-white/95">
                      {text || "—"}
                    </div>
                  </div>
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -bottom-2 left-1/2 -translate-x-1/2 -translate-x-5 w-3 h-3 rounded-full bg-neutral-900"
                  />
                  <span
                    aria-hidden
                    className="pointer-events-none absolute left-1/2 -translate-x-1/2 -translate-x-3 w-2 h-2 rounded-full bg-neutral-900"
                    style={{ bottom: "-1.125rem" }}
                  />
                </div>
              ) : (
                // REGULAR NOTE: bubble เขียว (ไม่มี label)
                <div className="relative text-center">
                  <div className="inline-block rounded-[18px] bg-green-100 text-gray-800 px-5 py-2.5 shadow-sm">
                    <div className="text-[16px] md:text-[17px] font-semibold leading-snug break-words">
                      {text || "—"}
                    </div>
                  </div>
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -bottom-2 left-1/2 -translate-x-1/2 -translate-x-5 w-3 h-3 rounded-full bg-green-100"
                  />
                  <span
                    aria-hidden
                    className="pointer-events-none absolute left-1/2 -translate-x-1/2 -translate-x-3 w-2 h-2 rounded-full bg-green-100"
                    style={{ bottom: "-1.125rem" }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* ===== AVATAR ===== */}
          <div className="px-6 pt-5 pb-1 text-center">
            <div className="flex items-center justify-center">
              <div className="flex items-center -space-x-3">
                {/* host (big) */}
                <div className="relative h-16 w-16 rounded-full ring-4 ring-white overflow-hidden shadow-lg">
                  <img
                    src={hostPfp || "/images/pfp.png"}
                    alt="host"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      if (e.currentTarget.src !== "/images/pfp.png")
                        e.currentTarget.src = "/images/pfp.png";
                    }}
                  />
                </div>
                {/* small members (party only) */}
                {isParty &&
                  members.slice(0, 2).map((m) => (
                    <div
                      key={m.user_id}
                      className="relative h-10 w-10 rounded-full ring-2 ring-white overflow-hidden shadow-md"
                    >
                      <img
                        src={m.img || "/images/pfp.png"}
                        alt={m.user_name || "member"}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          if (e.currentTarget.src !== "/images/pfp.png")
                            e.currentTarget.src = "/images/pfp.png";
                        }}
                      />
                    </div>
                  ))}
              </div>
            </div>
            <div className="mt-3 text-[15px] font-medium text-gray-900">
              {isParty ? partyTitle : noteTitle}
            </div>
          </div>

          {/* ===== CONTENT ===== */}
          <div className="px-6 pb-6">
            {isParty ? (
              <>
                <div className="mt-2 mb-4 flex items-center justify-center gap-2 text-gray-700">
                  <UsersIcon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">
                    Party <span className="font-semibold">{curr}/{max}</span> {memberWord}
                  </span>
                </div>

                {joined ? (
                  <InfoCard tone="success">
                    You have already joined this party. Open the note to chat with members.
                  </InfoCard>
                ) : hasOwnNote && Number(ownNoteId) !== Number(noteId) ? (
                  <InfoCard tone="warn">
                    You already have your own note (note #{ownNoteId}). Replace or delete it before joining a party.
                  </InfoCard>
                ) : alreadyInAnotherParty && Number(currentPartyId) !== Number(noteId) ? (
                  <InfoCard tone="warn">
                    You are already in another party{currentPartyId ? ` (note #${currentPartyId})` : ""}. Leave it first to join this one.
                  </InfoCard>
                ) : isFull ? (
                  <InfoCard tone="warn">Party is full. Please check back later.</InfoCard>
                ) : canShowCTA ? (
                  <div className="rounded-2xl border border-gray-200 p-6 text-center shadow-sm">
                    <div className="text-lg font-semibold text-gray-900">
                      Joining {partyTitle}?
                    </div>
                    <div className="mt-1 text-sm text-gray-500">
                      Join this party to chat with other members!
                    </div>
                    <div className="mt-5 flex justify-center gap-3">
                      <button
                        onClick={() => setShowPopup(false)}
                        className="rounded-lg border border-gray-300 bg-white px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleJoin}
                        disabled={joining}
                        className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-60"
                      >
                        {joining ? "Joining…" : "Join Party"}
                      </button>
                    </div>
                  </div>
                ) : null}
              </>
            ) : (
              // REGULAR NOTE: comment section
              <div className="mt-2 rounded-2xl border border-gray-200 bg-white p-4 shadow-inner">
                <CommentSection noteId={noteId} userId={viewerUserId} />
              </div>
            )}

            {/* bottom close */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowPopup(false)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Close
              </button>
            </div>
          </div>

          <Toast toast={toast} onClose={() => setToast(null)} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---------- UI bits ---------- */

function InfoCard({ tone = "info", children }) {
  const toneMap =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : "border-amber-200 bg-amber-50 text-amber-800";
  return <div className={`rounded-2xl border px-4 py-3 ${toneMap}`}>{children}</div>;
}

function Toast({ toast, onClose }) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 12, opacity: 0 }}
          className="pointer-events-none absolute bottom-3 left-1/2 z-[1100] -translate-x-1/2"
        >
          <div
            className={`pointer-events-auto inline-flex items-center gap-2 rounded-xl px-3 py-2 shadow-lg ring-1 ring-black/5 ${
              toast.type === "success"
                ? "bg-emerald-600 text-white"
                : toast.type === "info"
                ? "bg-sky-600 text-white"
                : "bg-red-600 text-white"
            }`}
          >
            <span className="text-sm">{toast.text}</span>
            <button
              onClick={onClose}
              className="rounded-md px-2 py-0.5 text-xs/4 hover:bg-white/20"
            >
              Close
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

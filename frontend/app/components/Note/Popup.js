// frontend/app/components/Popup.js
"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { XMarkIcon, UsersIcon } from "@heroicons/react/24/outline";
import { SparklesIcon } from "@heroicons/react/24/solid";

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

  // state
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

  // toast (no alert)
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

  // If viewer is the host, consider joined immediately
  useEffect(() => {
    if (!showPopup) return;
    if (ownerId && viewerUserId && String(ownerId) === String(viewerUserId)) {
      setJoined(true);
    }
  }, [showPopup, ownerId, viewerUserId]);

  // Hard check: viewer must NOT have their own note to be allowed to join another party
  useEffect(() => {
    if (!showPopup || !viewerUserId) return;
    (async () => {
      try {
        const resp = await fetch(`http://localhost:8000/api/note/user/${viewerUserId}`, {
          headers: { ...authHeaders },
          cache: "no-store",
        });
        const raw = await resp.json().catch(() => null);
        const n = raw && typeof raw === "object" ? (raw.note ?? raw) : null;

        if (n && n.note_id) {
          setHasOwnNote(true);
          setOwnNoteId(n.note_id);
          // If their own note is a party (host), treat as "already in another party"
          if (Number(n.max_party) > 0 && Number(n.note_id) !== Number(noteId)) {
            setAlreadyInAnotherParty(true);
            setCurrentPartyId(n.note_id);
          }
        } else {
          setHasOwnNote(false);
          setOwnNoteId(null);
        }
      } catch {
        // silent
      }
    })();
  }, [showPopup, viewerUserId, authHeaders, noteId]);

  // Load host/members from /api/note/:id/members and derive joined from server
  useEffect(() => {
    if (!showPopup) return;

    (async () => {
      if (!isParty || !noteId) {
        setMembers([]);
        return;
      }
      setLoadingMembers(true);
      try {
        const resp = await fetch(`http://localhost:8000/api/note/${noteId}/members`, {
          headers: { ...authHeaders },
          cache: "no-store",
        });
        const data = await resp.json().catch(() => ({}));

        if (resp.ok && data && Array.isArray(data.members)) {
          // host picture
          setHostPfp(data?.host?.img || null);

          // sync counts from server
          if (typeof data?.crr_party === "number") setCurr(Number(data.crr_party));
          if (typeof data?.max_party === "number") setMax(Number(data.max_party));

          const norm = data.members.map((m) => ({
            user_id: m.user_id,
            user_name: m.user_name || "anonymous",
            img: m.img || null,
          }));
          setMembers(norm);

          // derive joined from host or member list
          const viewerId = viewerUserId ? String(viewerUserId) : null;
          const hostJoined =
            viewerId && data?.host?.user_id && String(data.host.user_id) === viewerId;
          const inMembers =
            viewerId && norm.some((m) => String(m.user_id) === viewerId);
          if (hostJoined || inMembers) setJoined(true);
        } else {
          setMembers([]);
        }
      } finally {
        setLoadingMembers(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showPopup, isParty, noteId]);

  // Auto-join via ?autoJoin=1 (keeps toast for errors)
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
            const msg = (data?.error || "Join failed").toString();
            showToast(msg, "error");
          }
        }
      } catch {
        showToast("Cannot join party right now", "error");
      } finally {
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

    // extra FE guard: must have neither own note nor another party
    if (hasOwnNote && Number(ownNoteId) !== Number(noteId)) {
      showToast("You already have your own note. Replace or delete it first.", "info");
      return;
    }
    if (alreadyInAnotherParty && Number(currentPartyId) !== Number(noteId)) {
      showToast("You are already in another party. Leave it first.", "info");
      return;
    }

    if (!authed) {
      showToast("Please sign in to join this party.", "info");
      return;
    }
    if (curr >= max) {
      showToast("Party is full", "error");
      return;
    }
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
          showToast("You are already in another party. Leave it first.", "info");
          return;
        }
        if (data?.error_code === "PARTY_FULL") {
          showToast("Party is full", "error");
          return;
        }
        const msg = (data?.error || "Join failed").toString();
        showToast(msg, "error");
        return;
      }
      setJoined(true);
      if (typeof data?.data?.crr_party === "number") setCurr(Number(data.data.crr_party));
      if (typeof data?.data?.max_party === "number") setMax(Number(data.data.max_party));
      showToast("Joined party 🎉", "success");

      // reload members
      try {
        const m = await fetchJson(`http://localhost:8000/api/note/${noteId}/members`, {
          headers: { ...authHeaders },
          cache: "no-store",
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
    } finally {
      setJoining(false);
    }
  }

  const canShowCTA =
    isParty &&
    !joined &&
    !isFull &&
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

          {/* banner (pill) */}
          <div className="p-6 pb-2">
            <div className="inline-block rounded-2xl bg-neutral-900 text-white px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-fuchsia-300">
                <SparklesIcon className="h-4 w-4" />
                <span>{crazyLabel}</span>
              </div>
              <div className="mt-1 text-[15px] leading-snug break-words">
                {text || "—"}
              </div>
            </div>
          </div>

          {/* avatars + party title (centered, like the mock) */}
          <div className="px-6 pt-2 pb-1 text-center">
            <div className="mx-auto flex items-center justify-center -space-x-2">
              {/* host first */}
              <div className="relative h-10 w-10 rounded-full ring-2 ring-white overflow-hidden shadow">
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
              {/* first 2 members */}
              {members.slice(0, 2).map((m) => (
                <div
                  key={m.user_id}
                  className="relative h-10 w-10 rounded-full ring-2 ring-white overflow-hidden shadow"
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
            <div className="mt-2 text-base font-medium text-gray-900">
              {partyTitle}
            </div>
          </div>

          {/* content */}
          <div className="px-6 pb-6">
            {isParty ? (
              <>
                {/* status row */}
                <div className="mt-3 mb-4 flex items-center justify-center gap-2 text-gray-700">
                  <UsersIcon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">
                    Party{" "}
                    <span className="font-semibold">
                      {curr}/{max}
                    </span>{" "}
                    {memberWord}
                  </span>
                </div>

                {/* states */}
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
                  <div className="rounded-2xl border border-gray-200 p-5 text-center">
                    <div className="text-lg font-semibold text-gray-900">
                      Joining {partyTitle}?
                    </div>
                    <div className="mt-1 text-sm text-gray-500">
                      Join this party to chat with other members!
                    </div>
                    <div className="mt-5 flex justify-center gap-3">
                      <button
                        onClick={() => setShowPopup(false)}
                        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleJoin}
                        disabled={joining}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                      >
                        {joining ? "Joining…" : "Join Party"}
                      </button>
                    </div>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-700 text-center">
                This is a regular note.
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

          {/* toast */}
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
  return (
    <div className={`rounded-2xl border px-4 py-3 ${toneMap}`}>{children}</div>
  );
}

function AvatarStack({ people = [], loading = false, maxShow = 5 }) {
  const list = Array.isArray(people) ? people.slice(0, maxShow) : [];
  const more = Math.max(0, (people?.length || 0) - list.length);

  return (
    <div className="flex items-center">
      {loading && !people?.length ? (
        <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200" />
      ) : (
        <>
          {list.map((p, i) => (
            <div
              key={p.user_id ?? i}
              className="relative h-8 w-8 -ml-2 first:ml-0 overflow-hidden rounded-full ring-2 ring-white shadow"
              title={p.user_name || "member"}
            >
              <img
                src={p.img || "/images/pfp.png"}
                alt={p.user_name || "member"}
                className="h-full w-full object-cover"
                onError={(e) => {
                  if (e.currentTarget.src !== "/images/pfp.png")
                    e.currentTarget.src = "/images/pfp.png";
                }}
              />
            </div>
          ))}
          {more > 0 && (
            <div className="ml-2 text-xs text-gray-500">+{more} more</div>
          )}
        </>
      )}
    </div>
  );
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

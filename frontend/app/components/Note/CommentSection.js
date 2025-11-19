// frontend/app/components/CommentSection.js
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

/* ---------------- utils ---------------- */
const API = "http://localhost:8000/api";
const VISIBLE_ROOT_LIMIT = 20; // จำนวน root comments ที่แสดงล่าสุด

function cx(...xs) {
  return xs.filter(Boolean).join(" ");
}

function relTime(iso) {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, Math.floor((now - t) / 1000)); // sec

  if (diff < 5) return "just now";
  if (diff < 60) return `${diff}s ago`;
  const m = Math.floor(diff / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  const w = Math.floor(d / 7);
  if (w < 5) return `${w}w ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo ago`;
  const y = Math.floor(d / 365);
  return `${y}y ago`;
}

function updateMsg(list, id, message) {
  return list.map((c) =>
    c.comment_id === id
      ? { ...c, message }
      : { ...c, children: updateMsg(c.children || [], id, message) }
  );
}

function removeById(list, id) {
  return list
    .filter((c) => c.comment_id !== id)
    .map((c) => ({ ...c, children: removeById(c.children || [], id) }));
}

/* ---------------- helpers: profile url ---------------- */
const PROFILE_BASE = process.env.NEXT_PUBLIC_PROFILE_BASE || "/profile";
function buildProfileUrl(handle) {
  if (!handle) return "/";
  if (PROFILE_BASE === "root") return `/${handle}`;
  if (PROFILE_BASE === "@root") return `/@${handle}`;
  return `${PROFILE_BASE}/${handle}`;
}

/* ---------------- Skeleton row (ตอนโหลดคอมเมนต์) ---------------- */
function CommentSkeletonRow() {
  return (
    <div className="mt-3 ml-2 animate-pulse">
      <div className="flex gap-3 items-start">
        <div className="w-9 h-9 rounded-full bg-slate-200" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-24 bg-slate-200 rounded" />
          <div className="h-3 w-40 bg-slate-100 rounded" />
          <div className="h-3 w-32 bg-slate-100 rounded" />
        </div>
      </div>
    </div>
  );
}

/* ---------------- Single Comment ---------------- */
function CommentItem({
  comment,
  meId,
  onReplySubmit,
  onEditSubmit,
  onDeleteSubmit,
  onOpenProfile,
  collapsedMap,
  setCollapsedMap,
  rateLimitActive,
  rateLimitRemaining,
  rateLimitMessage,
}) {
  const isMine = meId && String(meId) === String(comment.user_id);
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.message || "");
  const [menuOpen, setMenuOpen] = useState(false);

  const hasChildren = (comment.children || []).length > 0;
  const expanded = collapsedMap[comment.comment_id] ?? false;

  // helper: save edit
  const handleSaveEdit = async () => {
    const value = draft.trim();
    if (!value) return;
    const ok = await onEditSubmit(comment.comment_id, value);
    if (ok) setEditing(false);
  };

  // close dropdown on outside click
  useEffect(() => {
    const onDoc = (e) => {
      if (
        !e.target.closest ||
        !e.target.closest(`[data-menu-anchor="${comment.comment_id}"]`)
      ) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, [comment.comment_id]);

  const loginName =
    comment.login_name ||
    comment?.users?.login_name ||
    comment?.user?.login_name ||
    "";

  const displayName =
    comment.user_name || comment?.users?.user_name || "anonymous";

  const canOpenProfile =
    !!loginName && String(loginName).toLowerCase() !== "anonymous";

  const avatar = comment.img || "/images/pfp.png";

  return (
    <div className="mt-3">
      <div className="flex gap-3 items-start">
        {/* avatar */}
        <button
          type="button"
          onClick={() => canOpenProfile && onOpenProfile(loginName)}
          className={cx(
            "shrink-0",
            canOpenProfile ? "cursor-pointer" : "cursor-default"
          )}
          title={canOpenProfile ? `@${loginName}` : undefined}
          aria-label={canOpenProfile ? `Open @${loginName}` : undefined}
        >
          <img
            src={avatar}
            alt="avatar"
            className="w-9 h-9 rounded-full object-cover ring-1 ring-black/5"
            onError={(e) => {
              if (e.currentTarget.src !== "/images/pfp.png")
                e.currentTarget.src = "/images/pfp.png";
            }}
          />
        </button>

        {/* bubble (group for hover) */}
        <div className="flex-1 min-w-0">
          <div className="group relative inline-block max-w-full">
            {/* three-dots (owner only) */}
            {isMine && (
              <div
                data-menu-anchor={comment.comment_id}
                className={cx(
                  "absolute top-2 right-3 md:right-3",
                  "opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition"
                )}
              >
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  className="rounded-full p-1.5 bg-white shadow-sm ring-1 ring-gray-300 hover:bg-gray-50"
                  aria-label="More"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-gray-600"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </button>

                {menuOpen && (
                  <div className="mt-1 w-32 rounded-xl bg-white shadow-lg ring-1 ring-black/5 overflow-hidden text-sm">
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left hover:bg-gray-50"
                      onClick={() => {
                        setMenuOpen(false);
                        setEditing(true);
                        setDraft(comment.message || "");
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left text-red-600 hover:bg-red-50"
                      onClick={async () => {
                        setMenuOpen(false);
                        await onDeleteSubmit(comment.comment_id);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* bubble */}
            <div className="rounded-2xl bg-white ring-1 ring-gray-200 shadow-sm px-4 py-3 pr-9">
              {/* header: name • time */}
              <div className="flex items-baseline gap-2 text-[13px] text-gray-500">
                {canOpenProfile ? (
                  <button
                    type="button"
                    onClick={() => onOpenProfile(loginName)}
                    className="font-semibold text-gray-800 hover:underline focus:outline-none"
                    title={`@${loginName}`}
                  >
                    {displayName}
                  </button>
                ) : (
                  <span className="font-semibold text-gray-800">
                    {displayName}
                  </span>
                )}
                <span>•</span>
                <span title={new Date(comment.created_at).toLocaleString()}>
                  {relTime(comment.created_at)}
                </span>
              </div>

              {/* content OR editor */}
              {!editing ? (
                <p className="mt-1 text-[15px] text-gray-900 break-words">
                  {comment.message}
                </p>
              ) : (
                <div className="mt-1">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    rows={2}
                    placeholder="Edit your comment..."
                    className="w-[min(560px,78vw)] max-w-full rounded-xl border px-3 py-2 text-[15px] focus:ring-1 focus:ring-blue-500 outline-none"
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        e.preventDefault();
                        setEditing(false);
                        setDraft(comment.message || "");
                      } else if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSaveEdit();
                      }
                    }}
                  />
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="hidden sm:block text-[11px] text-gray-400">
                      escape to cancel • enter to save
                    </span>
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(false);
                          setDraft(comment.message || "");
                        }}
                        className="px-3 py-1.5 rounded-lg border bg-white text-sm hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveEdit}
                        disabled={!draft.trim()}
                        className="px-4 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* actions under bubble */}
          <div className="mt-1 ml-2 flex items-center gap-4 text-xs text-blue-600">
            <button
              type="button"
              onClick={() => setShowReplyBox((v) => !v)}
              className="font-medium hover:underline"
            >
              Reply
            </button>

            {hasChildren && (
              <button
                type="button"
                onClick={() =>
                  setCollapsedMap((m) => ({
                    ...m,
                    [comment.comment_id]: !expanded,
                  }))
                }
                className="text-gray-500 hover:underline"
              >
                {expanded
                  ? "Hide replies"
                  : `View ${comment.children.length} repl${
                      comment.children.length > 1 ? "ies" : "y"
                    }`}
              </button>
            )}
          </div>

          {/* reply box */}
          {showReplyBox && (
            <div className="mt-2 flex flex-col items-start gap-1">
              <div className="flex w-full items-start gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write a reply..."
                  className="flex-1 rounded-full border px-3 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                />
                <button
                  type="button"
                  onClick={async () => {
                    if (!replyText.trim()) return;
                    await onReplySubmit(replyText, comment.comment_id);
                    setReplyText("");
                    setShowReplyBox(false);
                  }}
                  disabled={rateLimitActive || !replyText.trim()}
                  className="px-3 py-1.5 rounded-full bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {rateLimitActive
                    ? rateLimitRemaining > 0
                      ? `Wait ${rateLimitRemaining}s`
                      : "Wait..."
                    : "Send"}
                </button>
              </div>
              {rateLimitActive && (
                <p className="ml-1 text-[11px] text-amber-600">
                  {rateLimitMessage ||
                    "You are commenting too fast. Please wait a moment."}
                  {rateLimitRemaining > 0
                    ? ` (${rateLimitRemaining}s)`
                    : null}
                </p>
              )}
            </div>
          )}

          {/* children */}
          {hasChildren && expanded && (
            <div className="ml-6 border-l pl-4">
              {comment.children.map((child) => (
                <CommentItem
                  key={child.comment_id}
                  comment={child}
                  meId={meId}
                  onReplySubmit={onReplySubmit}
                  onEditSubmit={onEditSubmit}
                  onDeleteSubmit={onDeleteSubmit}
                  onOpenProfile={onOpenProfile}
                  collapsedMap={collapsedMap}
                  setCollapsedMap={setCollapsedMap}
                  rateLimitActive={rateLimitActive}
                  rateLimitRemaining={rateLimitRemaining}
                  rateLimitMessage={rateLimitMessage}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Toast สำหรับ login ---------------- */

function LoginToast({ open, onClose, onGoLogin }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 16, opacity: 0 }}
          transition={{ duration: 0.22 }}
          className="pointer-events-none fixed bottom-4 left-1/2 z-[9999] -translate-x-1/2"
        >
          <div className="pointer-events-auto flex items-center gap-3 rounded-2xl bg-sky-500 px-4 py-2 text-sm text-white shadow-lg ring-1 ring-black/5">
            <span className="font-semibold">
              Please sign in or post a note before commenting.
            </span>
            <button
              type="button"
              onClick={onGoLogin}
              className="text-xs font-semibold underline"
            >
              Login
            </button>

            <button
              type="button"
              onClick={onClose}
              className="text-xs opacity-80 hover:opacity-100"
            >
              Close
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---------------- Section (root) ---------------- */
export default function CommentSection({ noteId, userId }) {
  const router = useRouter();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [collapsedMap, setCollapsedMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAllRoots, setShowAllRoots] = useState(false);
  const [showLoginToast, setShowLoginToast] = useState(false);
  const [userExists, setUserExists] = useState(null); // เช็คว่า userId นี้อยู่ใน DB ไหม

  // rate limit state
  const [rateLimit, setRateLimit] = useState(null); // { message, until }
  const [now, setNow] = useState(Date.now());

  const scrollRef = useRef(null);

  // เช็ค userId กับ DB ครั้งเดียว (หรือเมื่อ userId เปลี่ยน)
  useEffect(() => {
    let cancelled = false;

    async function checkUser() {
      if (!userId) {
        setUserExists(false);
        return;
      }
      try {
        const res = await fetch(`${API}/user/${userId}`, {
          cache: "no-store",
        });

        if (cancelled) return;

        if (res.status === 404 || res.status === 400) {
          console.warn("stale userId in comment section, user not found");
          setUserExists(false);
          return;
        }

        if (!res.ok) {
          console.error("check user failed:", res.status);
          setUserExists(false);
          return;
        }

        const data = await res.json();
        if (!cancelled) {
          setUserExists(!!data);
        }
      } catch (e) {
        if (!cancelled) {
          console.error("check user failed:", e);
          setUserExists(false);
        }
      }
    }

    checkUser();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  // tick สำหรับ countdown rate limit
  useEffect(() => {
    if (!rateLimit) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [rateLimit]);

  const rateLimitRemaining =
    rateLimit && rateLimit.until
      ? Math.max(0, Math.ceil((rateLimit.until - now) / 1000))
      : 0;
  const rateLimitActive = !!rateLimit && rateLimitRemaining > 0;

  // auto clear rateLimit เมื่อหมดเวลา
  useEffect(() => {
    if (!rateLimit) return;
    if (rateLimit.until && rateLimit.until <= Date.now()) {
      setRateLimit(null);
    }
  }, [rateLimit, now]);

  // helper: ต้องมี user ที่ valid ก่อนถึงจะโพสต์ได้
  const requireUser = () => {
    if (!userId) {
      setShowLoginToast(true);
      return false;
    }
    if (userExists === false) {
      setShowLoginToast(true);
      return false;
    }
    return true;
  };

  // load comments
  useEffect(() => {
    if (!noteId) return;
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API}/comment/note/${noteId}`);
        const data = await res.json();
        const tree = Array.isArray(data.comment) ? data.comment : [];
        if (!cancelled) setComments(tree);
      } catch (e) {
        if (!cancelled) console.error("load comments failed", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [noteId]);

  async function refresh() {
    try {
      const res = await fetch(`${API}/comment/note/${noteId}`);
      const data = await res.json();
      const tree = Array.isArray(data.comment) ? data.comment : [];
      setComments(tree);
    } catch (e) {
      console.error("refresh comments failed", e);
    }
  }

  // create new root comment
  async function handleCreate(message) {
    if (!requireUser()) return;

    const payload = {
      user_id: userId,
      message,
      note_id: noteId,
      parent_comment_id: null,
    };

    try {
      setSubmitting(true);

      const res = await fetch(`${API}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let data = null;
      try {
        data = await res.json();
      } catch (_) {
        // เผื่อ backend ไม่ได้ส่ง JSON กลับมา (แต่ปกติจะมี)
      }

      if (!res.ok) {
        // ✅ เคส rate limit
        if (res.status === 429) {
          let retryAfterSec = Number(data?.retry_after);
          if (!Number.isFinite(retryAfterSec) || retryAfterSec <= 0) {
            retryAfterSec = 5;
          }

          const msg =
            data?.error_code === "COMMENT_BURST_LIMIT"
              ? "You have posted too many comments in a short time. Please wait a moment."
              : "You are commenting too fast. Please wait a moment.";

          const until = Date.now() + retryAfterSec * 1000;
          setRateLimit({ message: msg, until });
        }
        return;
      }

      // ok → clear rate limit error (ถ้ามี)
      setRateLimit(null);

      // ⚡ ยิง notification ไปหาเจ้าของโน้ต
      const newCommentId = data?.id ?? data?.comment?.comment_id;
      if (newCommentId && userId && noteId != null) {
        try {
          await fetch(`${API}/noti`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sender_id: userId,
              comment_id: Number(newCommentId),
              note_id: Number(noteId),
              parent_comment_id: null,
            }),
          });
        } catch (e) {
          console.error("create comment notification failed:", e);
        }
      }

      await refresh();

      if (scrollRef.current) {
        requestAnimationFrame(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          }
        });
      }
      setShowAllRoots(true);
    } finally {
      setSubmitting(false);
    }
  }

  // reply
  async function handleReply(message, parentId) {
    if (!requireUser()) return;

    const payload = {
      user_id: userId,
      message,
      note_id: noteId,
      parent_comment_id: parentId,
    };

    try {
      const res = await fetch(`${API}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let data = null;
      try {
        data = await res.json();
      } catch (_) {}

      if (!res.ok) {
        if (res.status === 429) {
          const retryAfter = data?.retry_after || 0;
          const msg =
            data?.error ||
            (data?.error_code === "COMMENT_BURST_LIMIT"
              ? "You have posted too many comments in a short time. Please wait before posting again."
              : "You are commenting too fast. Please wait a moment before posting again.");
          const until =
            retryAfter > 0
              ? Date.now() + retryAfter * 1000
              : Date.now() + 5000;
          setRateLimit({ message: msg, until });
        }
        return;
      }

      setRateLimit(null);

      // ⚡ ยิง notification ไปหาเจ้าของคอมเมนต์แม่ (และผูกกับ note นี้)
      const newCommentId = data?.id ?? data?.comment?.comment_id;
      if (newCommentId && userId && noteId != null && parentId != null) {
        try {
          await fetch(`${API}/noti`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sender_id: userId,
              comment_id: Number(newCommentId),
              note_id: Number(noteId),
              parent_comment_id: Number(parentId),
            }),
          });
        } catch (e) {
          console.error("create reply notification failed:", e);
        }
      }

      await refresh();
    } catch (e) {
      console.error("reply failed", e);
    }
  }


  // edit
  async function handleEdit(id, message) {
    try {
      const res = await fetch(`${API}/comment/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      if (!res.ok) return false;
      setComments((prev) => updateMsg(prev, id, message));
      return true;
    } catch {
      return false;
    }
  }

  // delete
  async function handleDelete(id) {
    try {
      const res = await fetch(`${API}/comment/${id}`, { method: "DELETE" });
      if (!res.ok) return;
      setComments((prev) => removeById(prev, id));
    } catch (e) {
      console.error("delete failed", e);
    }
  }

  // open profile by handle
  function openProfileByHandle(handle) {
    if (!handle) return;
    try {
      const url = buildProfileUrl(handle);
      router.push(url);
    } catch (err) {
      console.warn("navigate profile failed, fallback to note:", err);
      if (noteId) router.push(`/note/${noteId}`);
    }
  }

  // root comments & limit
  const rootComments = comments.filter((c) => !c.parent_comment_id);
  const rootCount = rootComments.length;
  const visibleRoots =
    showAllRoots || rootCount <= VISIBLE_ROOT_LIMIT
      ? rootComments
      : rootComments.slice(rootCount - VISIBLE_ROOT_LIMIT);

  // ถ้า user ไม่ valid → ห้าม edit/delete โดยถือว่า meId = null
  const meId = userExists ? userId : null;

  return (
    <div className="flex flex-col max-h-[60vh] min-h-[260px] relative">
      {/* scroll area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto pr-1 space-y-1 pb-3"
      >
        {loading ? (
          <>
            <CommentSkeletonRow />
            <CommentSkeletonRow />
          </>
        ) : rootCount === 0 ? (
          <p className="text-gray-400 text-sm text-center mt-2">
            No comments yet
          </p>
        ) : (
          <>
            {rootCount > VISIBLE_ROOT_LIMIT && !showAllRoots && (
              <div className="flex justify-center my-1">
                <button
                  type="button"
                  onClick={() => setShowAllRoots(true)}
                  className="text-xs text-blue-600 hover:underline"
                >
                  View older comments ({rootCount - VISIBLE_ROOT_LIMIT} more)
                </button>
              </div>
            )}

            {visibleRoots.map((c) => (
              <CommentItem
                key={c.comment_id}
                comment={c}
                meId={meId}
                onReplySubmit={handleReply}
                onEditSubmit={handleEdit}
                onDeleteSubmit={handleDelete}
                onOpenProfile={openProfileByHandle}
                collapsedMap={collapsedMap}
                setCollapsedMap={setCollapsedMap}
                rateLimitActive={rateLimitActive}
                rateLimitRemaining={rateLimitRemaining}
                rateLimitMessage={rateLimit?.message || ""}
              />
            ))}
          </>
        )}
      </div>

      {/* input row */}
      <div className="mt-2 border-t pt-3 bg-white">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="flex-1 rounded-full border px-4 py-2 focus:ring-1 focus:ring-blue-500 outline-none"
            onFocus={() => {
              // ถ้ายังไม่มี user หรือ userId นี้หายจาก DB แล้ว → เตือนเลย
              if (!userId || userExists === false) {
                setShowLoginToast(true);
              }
            }}
          />
          <button
            type="button"
            onClick={async () => {
              const text = newComment.trim();
              if (!text) return;
              await handleCreate(text);
              setNewComment("");
            }}
            disabled={submitting || !newComment.trim() || rateLimitActive}
            className="px-4 py-2 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting
              ? "Sending..."
              : rateLimitActive && rateLimitRemaining > 0
              ? `Wait ${rateLimitRemaining}s`
              : "Send"}
          </button>
        </div>
        {rateLimitActive && (
          <p className="mt-1 text-xs text-amber-600">
            {rateLimit?.message ||
              "You are commenting too fast. Please wait a moment before posting again."}
            {rateLimitRemaining > 0 ? ` (${rateLimitRemaining}s)` : null}
          </p>
        )}
      </div>

      <LoginToast
        open={showLoginToast}
        onClose={() => setShowLoginToast(false)}
        onGoLogin={() => {
          setShowLoginToast(false);
          router.push("/login");
        }}
      />
    </div>
  );
}

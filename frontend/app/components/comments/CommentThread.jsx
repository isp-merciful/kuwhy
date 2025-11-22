"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import useUserId from "../Note/useUserId"; 

const API_BASE =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_BASE ||
  process.env.API_BASE ||
  "http://localhost:8000";

function toAbs(url) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  if (url.startsWith("/uploads/")) return `${API_BASE}${url}`;
  return url;
}

function formatDate(iso) {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("en-GB-u-ca-gregory", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: "Asia/Bangkok",
    }).format(new Date(iso));
  } catch {
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(
      d.getUTCDate()
    )} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(
      d.getUTCSeconds()
    )} UTC`;
  }
}

function CommentItem({
  node,
  onReply,
  replyingTo,
  onSubmitReply,
  currentUserId,
  onEdited,
  onDeleted,
}) {
  const [text, setText] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const isReplying = replyingTo === node.comment_id;
  const isOwner =
    currentUserId && String(node.user_id) === String(currentUserId);

  const avatarSrc = node.img ? toAbs(node.img) : "/images/pfp.png";

  async function handleSaveEdit() {
    const newText = text.trim();
    if (!newText || saving) return;

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/comment/${node.comment_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: newText }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to update comment");
      } else {
        setIsEditing(false);
        setShowMenu(false);
        onEdited?.(); 
      }
    } catch (e) {
      console.error(e);
      alert("Failed to update comment");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (deleting) return;
    if (!window.confirm("Delete this comment?")) return;

    setDeleting(true);
    try {
      const res = await fetch(`${API_BASE}/api/comment/${node.comment_id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to delete comment");
      } else {
        setShowMenu(false);
        onDeleted?.(); 
      }
    } catch (e) {
      console.error(e);
      alert("Failed to delete comment");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <li className="rounded-lg border border-gray-200 p-4">
      {/* header line */}
      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
        <img
          src={avatarSrc}
          alt={node.user_name ?? "User avatar"}
          className="h-8 w-8 rounded-full object-cover"
          onError={(e) => {
            if (e.currentTarget.src !== "/images/pfp.png") {
              e.currentTarget.src = "/images/pfp.png";
            }
          }}
        />

        {/* name (clickable to profile if login_name exists) */}
        {node.login_name ? (
          <a
            href={`/profile/${encodeURIComponent(node.login_name)}`}
            className="font-medium hover:underline hover:underline-offset-2"
          >
            {node.user_name ?? "Anonymous"}
          </a>
        ) : (
          <span className="font-medium">{node.user_name ?? "Anonymous"}</span>
        )}

        <span className="text-gray-400">·</span>

        <time title={`Created: ${formatDate(node.created_at)}`}>
          {node.created_at ? formatDate(node.created_at) : ""}
        </time>

        {node.updated_at &&
          new Date(node.updated_at).getTime() !==
            new Date(node.created_at).getTime() && (
            <span className="text-gray-400">(edited)</span>
          )}

        {/* right controls: Reply + owner menu */}
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => {
              if (isEditing) return;
              onReply(node.comment_id);
              setShowMenu(false);
            }}
            className="text-xs text-blue-600 hover:underline"
          >
            Reply
          </button>

          {isOwner && !isEditing && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowMenu((v) => !v)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                aria-label="More actions"
              >
                ⋯
              </button>

              {showMenu && (
                <div className="absolute right-0 z-20 mt-1 w-28 rounded-md border border-gray-200 bg-white shadow-md">
                  <button
                    type="button"
                    onClick={() => {
                      setText(node.message || "");
                      setIsEditing(true);
                      setShowMenu(false);
                    }}
                    className="block w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="block w-full px-3 py-1.5 text-left text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* message or edit box */}
      {!isEditing ? (
        <p className="mt-2 whitespace-pre-wrap text-gray-800">
          {node.message}
        </p>
      ) : (
        <div className="mt-3 space-y-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full min-h-[80px] rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSaveEdit}
              disabled={saving || !text.trim()}
              className="rounded-md border border-emerald-500 bg-emerald-500 px-3 py-1 text-sm text-white hover:bg-emerald-600 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setShowMenu(false);
              }}
              className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* reply box – disabled while editing */}
      {isReplying && !isEditing && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!text.trim()) return;
            onSubmitReply(node.comment_id, text.trim(), () => setText(""));
          }}
          className="mt-3"
        >
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write a reply…"
            className="w-full min-h-[70px] rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="mt-2 flex gap-2">
            <button
              type="submit"
              className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50"
            >
              Reply
            </button>
            <button
              type="button"
              onClick={() => {
                setText("");
                onReply(null);
              }}
              className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* children */}
      {node.children?.length ? (
        <div className="mt-3 border-l pl-6">
          <ul className="space-y-4">
            {node.children.map((child) => (
              <CommentItem
                key={child.comment_id}
                node={child}
                onReply={onReply}
                replyingTo={replyingTo}
                onSubmitReply={onSubmitReply}
                currentUserId={currentUserId}
                onEdited={onEdited}
                onDeleted={onDeleted}
              />
            ))}
          </ul>
        </div>
      ) : null}
    </li>
  );
}

export default function CommentThread({ blogId, currentUserId = null }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rootText, setRootText] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);

  const [toastMsg, setToastMsg] = useState("");
  const toastTimerRef = useRef(null);

  const router = useRouter();
  const { data: session } = useSession();
  const apiToken = session?.apiToken || null;

  const hookUserId = useUserId();
  const userId = currentUserId || hookUserId;

  function showErrorToast(message) {
    if (!message) return;
    setToastMsg(message);
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = setTimeout(() => {
      setToastMsg("");
    }, 3000);
  }

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  async function load() {
    if (!blogId) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/comment/blog/${blogId}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const list = Array.isArray(json?.comment) ? json.comment : [];
      setItems(list);
    } catch (e) {
      console.error("Failed to load comments", e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [blogId]);

  async function postComment({ message, parent_comment_id = null }) {
    if (!message?.trim()) return;

    const body = {
      user_id: userId, 
      message: message.trim(),
      blog_id: Number(blogId),
      parent_comment_id,
    };

    const res = await fetch(`${API_BASE}/api/comment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiToken ? { Authorization: `Bearer ${apiToken}` } : {}),
      },
      body: JSON.stringify(body),
    });

    let data = null;
    try {
      data = await res.json();
    } catch {
    }

    if (!res.ok) {
      if (res.status === 403 && data?.code === "PUNISHED") {
        alert(
          data?.error ||
            "Your account is currently restricted from commenting. Your comment was not posted."
        );
        return;
      }

      if (
        res.status === 401 &&
        data?.error_code === "LOGIN_REQUIRED_FOR_BLOG_COMMENT"
      ) {
        if (typeof window !== "undefined") {
          const callback = encodeURIComponent(window.location.href);
          router.push(`/login?callbackUrl=${callback}`);
        } else {
          router.push("/login");
        }
        return;
      }

      if (
        res.status === 403 &&
        data?.error_code === "LOGIN_NAME_REQUIRED_FOR_BLOG_COMMENT"
      ) {
        alert("Please set your login name before commenting on blogs.");

        if (typeof window !== "undefined") {
          const callback = encodeURIComponent(window.location.href);
          router.push(`/login?callbackUrl=${callback}`);
        } else {
          router.push("/login");
        }
        return;
      }

      let msg = "Failed to add comment";
      if (data?.error || data?.message) msg = data.error || data.message;
      throw new Error(msg);
    }

    const newCommentId =
      data?.id ?? data?.comment?.comment_id ?? data?.comment_id ?? null;

    if (newCommentId && userId && blogId != null) {
      try {
        await fetch(`${API_BASE}/api/noti`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sender_id: userId,
            comment_id: Number(newCommentId),
            blog_id: Number(blogId),
            parent_comment_id: parent_comment_id
              ? Number(parent_comment_id)
              : null,
          }),
        });
      } catch (e) {
        console.error("create blog comment notification failed:", e);
      }
    }
  }

  async function submitRoot(e) {
    e.preventDefault();
    const text = rootText.trim();
    if (!text) return;

    try {
      await postComment({ message: text });
      setRootText("");
      await load();
    } catch (err) {
      console.error(err);
      showErrorToast(err.message || "Failed to post comment.");
    }
  }

  async function submitReply(parentId, text, clear) {
    try {
      await postComment({
        message: text,
        parent_comment_id: parentId,
      });
      clear?.();
      setReplyingTo(null);
      await load();
    } catch (err) {
      console.error(err);
      showErrorToast(err.message || "Failed to post reply.");
    }
  }

  const handleReload = () => {
    load();
  };

  return (
    <>
      <section className="pt-10 mt-6" aria-labelledby="comments-title">
        <h2
          id="comments-title"
          className="text-xl font-semibold text-emerald-900"
        >
          Comments {items?.length ? `(${items.length})` : ""}
        </h2>

        {!loading && items.length === 0 && (
          <p className="mt-4 mb-2 text-sm text-emerald-700/70">
            No comments yet. Be the first to comment!
          </p>
        )}

        <form
          onSubmit={submitRoot}
          className="mt-3 rounded-2xl border border-emerald-100 bg-white/80 backdrop-blur px-5 py-5 shadow-sm space-y-4"
        >
          <div>
            <label
              htmlFor="comment-input"
              className="block text-sm font-semibold text-emerald-700/80 mb-1"
            >
              Add a comment
            </label>
            <p className="text-xs text-emerald-700/60 mb-2">
              Your comment will be posted under your account
            </p>
          </div>

          <textarea
            id="comment-input"
            value={rootText}
            onChange={(e) => setRootText(e.target.value)}
            placeholder="Share your thoughts…"
            className="w-full min-h-[120px] rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm text-emerald-900 outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 placeholder-emerald-700/40 shadow-sm"
          />

          <div className="flex items-center justify-end">
            <button
              type="submit"
              disabled={!rootText.trim()}
              className="inline-flex items-center rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Post Comment
            </button>
          </div>
        </form>

        {loading ? (
          <p className="mt-8 text-sm text-emerald-700/70">
            Loading comments…
          </p>
        ) : items.length > 0 ? (
          <ul className="mt-8 space-y-5">
            {items.map((n) => (
              <CommentItem
                key={n.comment_id}
                node={n}
                replyingTo={replyingTo}
                onReply={setReplyingTo}
                onSubmitReply={submitReply}
                currentUserId={userId}
                onEdited={handleReload}
                onDeleted={handleReload}
              />
            ))}
          </ul>
        ) : null}
      </section>

      {toastMsg && (
        <div className="fixed bottom-4 right-4 z-50 max-w-xs rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 shadow-lg">
          <div className="flex items-start gap-2">
            <span className="mt-[2px] text-lg">⚠️</span>
            <div className="flex-1">{toastMsg}</div>
            <button
              type="button"
              onClick={() => setToastMsg("")}
              className="ml-2 text-xs text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import useUserId from "../Note/useUserId"; // adjust path if needed

// ✅ unify API_BASE like other files
const API_BASE =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_BASE ||
  process.env.API_BASE ||
  "http://localhost:8000";

// ✅ helper: convert /uploads/... to full URL
function toAbs(url) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  if (url.startsWith("/uploads/")) return `${API_BASE}${url}`;
  // frontend static asset, e.g. /images/pfp.png
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

function CommentItem({ node, onReply, replyingTo, onSubmitReply }) {
  const [text, setText] = useState("");
  const isReplying = replyingTo === node.comment_id;

  // ✅ avatar: use img from backend, convert to absolute, fallback to default
  const avatarSrc = node.img ? toAbs(node.img) : "/images/pfp.png";

  return (
    <li className="rounded-lg border border-gray-200 p-4">
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
        <span className="font-medium">{node.user_name ?? "Anonymous"}</span>
        <span className="text-gray-400">·</span>
        <time title={`Created: ${formatDate(node.created_at)}`}>
          {node.created_at ? formatDate(node.created_at) : ""}
        </time>

        {node.updated_at &&
          new Date(node.updated_at).getTime() !==
            new Date(node.created_at).getTime() && (
            <span className="text-gray-400">(edited)</span>
          )}
        <button
          onClick={() => onReply(node.comment_id)}
          className="ml-auto text-xs text-blue-600 hover:underline"
        >
          Reply
        </button>
      </div>

      <p className="mt-2 whitespace-pre-wrap text-gray-800">
        {node.message}
      </p>

      {isReplying && (
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
              onClick={() => onReply(null)}
              className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

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
              />
            ))}
          </ul>
        </div>
      ) : null}
    </li>
  );
}

/**
 * Props:
 *  - blogId: string | number   ← use this (from page)
 *  - currentUserId?: string | null (optional; if not provided we read from useUserId())
 */
export default function CommentThread({ blogId, currentUserId = null }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rootText, setRootText] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);

  const router = useRouter();
  const { data: session } = useSession();
  const apiToken = session?.apiToken || null;

  // prefer provided id; otherwise take the hook
  const hookUserId = useUserId();
  const userId = currentUserId || hookUserId;

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
      user_id: userId, // always send your user_id
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

    if (!res.ok) {
      let data = null;
      try {
        data = await res.json();
      } catch {
        // ถ้า parse json ไม่ได้ก็ปล่อยให้เป็น null
      }

      // 🔒 เคสโดน punish (timeout / ban) จาก ensureNotPunished
      if (res.status === 403 && data?.code === "PUNISHED") {
        alert(
          data?.error ||
            "Your account is currently restricted from commenting. Your comment was not posted."
        );
        return;
      }

      // 🔒 เคส blog comment: ยังไม่ล็อกอิน → ให้ redirect ไปหน้า login
      if (
        res.status === 401 &&
        data?.error_code === "LOGIN_REQUIRED_FOR_BLOG_COMMENT"
      ) {
        // alert("Please log in before commenting on blogs.");

        if (typeof window !== "undefined") {
          const callback = encodeURIComponent(window.location.href);
          router.push(`/login?callbackUrl=${callback}`);
        } else {
          router.push("/login");
        }
        return;
      }

      // 🔒 เคส blog comment: ล็อกอินแล้วแต่ยังไม่ได้ตั้ง login_name
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

      // เคสอื่น ๆ → โยน error ให้ caller จัดการเหมือนเดิม
      let msg = "Failed to add comment";
      if (data?.error || data?.message) msg = data.error || data.message;
      throw new Error(msg);
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
      alert(err.message);
      console.error(err);
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
      alert(err.message);
      console.error(err);
    }
  }

  return (
    <section className="pt-10 mt-6" aria-labelledby="comments-title">
      {/* Header */}
      <h2
        id="comments-title"
        className="text-xl font-semibold text-emerald-900"
      >
        Comments {items?.length ? `(${items.length})` : ""}
      </h2>

      {/* No comments message ABOVE form */}
      {!loading && items.length === 0 && (
        <p className="mt-4 mb-2 text-sm text-emerald-700/70">
          No comments yet. Be the first to comment!
        </p>
      )}

      {/* ROOT COMMENT BOX */}
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

      {/* COMMENT LIST */}
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
            />
          ))}
        </ul>
      ) : null}
    </section>
  );
}

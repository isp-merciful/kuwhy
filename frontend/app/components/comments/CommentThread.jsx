"use client";

import { useEffect, useState } from "react";
import useUserId from "../Note/useUserId"; // adjust path if needed

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

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
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} UTC`;
  }
}

function CommentItem({ node, onReply, replyingTo, onSubmitReply }) {
  const [text, setText] = useState("");
  const isReplying = replyingTo === node.comment_id;

  return (
    <li className="rounded-lg border border-gray-200 p-4">
      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
        <img src={node.img || "/images/pfp.png"} alt="" className="h-8 w-8 rounded-full object-cover" />
        <span className="font-medium">{node.user_name ?? "Anonymous"}</span>
        <span className="text-gray-400">·</span>
        <time title={`Created: ${formatDate(node.created_at)}`}>
          {node.created_at ? formatDate(node.created_at) : ""}
        </time>
        {node.updated_at &&
          new Date(node.updated_at).getTime() !== new Date(node.created_at).getTime() && (
            <span className="text-gray-400">(edited)</span>
          )}
        <button onClick={() => onReply(node.comment_id)} className="ml-auto text-xs text-blue-600 hover:underline">
          Reply
        </button>
      </div>

      <p className="mt-2 whitespace-pre-wrap text-gray-800">{node.message}</p>

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
            <button type="submit" className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50">Reply</button>
            <button type="button" onClick={() => onReply(null)} className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50">Cancel</button>
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

/** Props:
 *  - blogId: string | number   ← use this (from page)
 *  - currentUserId?: string | null (optional; if not provided we read from useUserId())
 */
export default function CommentThread({ blogId, currentUserId = null }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rootText, setRootText] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);

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
      const res = await fetch(`${API_BASE}/api/comment/blog/${blogId}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      // backend: { message: "getblog", comment: [...] }
      const list = Array.isArray(json?.comment) ? json.comment : [];
      setItems(list);
    } catch (e) {
      console.error("Failed to load comments", e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [blogId]);

  async function postComment({ message, parent_comment_id = null }) {
    if (!message?.trim()) return;
    const body = {
      user_id: userId,                     // always send your user_id
      message: message.trim(),
      blog_id: Number(blogId),
      parent_comment_id,
    };
    const res = await fetch(`${API_BASE}/api/comment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      let msg = "Failed to add comment";
      try {
        const data = await res.json();
        if (data?.error || data?.message) msg = data.error || data.message;
      } catch {}
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
      await postComment({ message: text, parent_comment_id: parentId });
      clear?.();
      setReplyingTo(null);
      await load();
    } catch (err) {
      alert(err.message);
      console.error(err);
    }
  }

  return (
    <section className="mt-8" aria-labelledby="comments-title">
      <h2 id="comments-title" className="text-lg font-semibold">
        Comments {items?.length ? `(${items.length})` : ""}
      </h2>

      {/* Root composer */}
      <form onSubmit={submitRoot} className="mt-4 space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Add a comment (posted under your user)
        </label>
        <textarea
          value={rootText}
          onChange={(e) => setRootText(e.target.value)}
          placeholder="Write something…"
          className="w-full min-h-[90px] rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={!rootText.trim()}
            className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
          >
            Post comment
          </button>
        </div>
      </form>

      {/* List */}
      {loading ? (
        <p className="mt-6 text-sm text-gray-500">Loading comments…</p>
      ) : items?.length ? (
        <ul className="mt-6 space-y-4">
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
      ) : (
        <p className="mt-6 text-sm text-gray-500">No comments yet.</p>
      )}
    </section>
  );
}

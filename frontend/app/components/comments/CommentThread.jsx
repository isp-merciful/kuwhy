"use client";

import { useEffect, useMemo, useState } from "react";

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
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(
      d.getUTCHours()
    )}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} UTC`;
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
        {node.updated_at && (
          <>
            <span className="text-gray-400">·</span>
            <span className="text-gray-400">(edited)</span>
          </>
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
            onSubmitReply(node.comment_id, text.trim(), () => {
              setText("");
            });
          }}
          className="mt-3 space-y-2"
        >
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full min-h-[70px] rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Write a reply…"
          />
          <div className="flex gap-2">
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
 *  - kind: "blog" | "note"
 *  - entityId: string | number
 *  - currentUserId?: string | null
 *  - allowAnonymous?: boolean (default true)
 */
export default function CommentThread({
  kind,
  entityId,
  currentUserId = null,
  allowAnonymous = true
}) {
  const [items, setItems] = useState([]);
  const [derivedUserId, setDerivedUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rootText, setRootText] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [postAnon, setPostAnon] = useState(allowAnonymous);

  useEffect(() => {
    if (currentUserId) { setDerivedUserId(currentUserId); return; }
    try {
      let id = localStorage.getItem('userId');
      if (id && id.startsWith('"') && id.endsWith('"')) {
        id = JSON.parse(id);
        localStorage.setItem('userId', id);
      }
      setDerivedUserId(id || null);
    } catch {
      setDerivedUserId(null);
    }
  }, [currentUserId]);

  const listURL = useMemo(
    () => `http://localhost:8000/api/comment/${kind}/${entityId}`,
    [kind, entityId]
  );

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(listURL, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load comments");
      const data = await res.json();
      setItems(data?.comment ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [listURL]);

  async function postComment(body) {
    const res = await fetch("http://localhost:8000/api/comment", {
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

    const body = {
      message: text,
      blog_id: kind === "blog" ? Number(entityId) : null,
      note_id: kind === "note" ? Number(entityId) : null,
    };
    if (postAnon) {
      body.isAnonymous = true;
    } else if (derivedUserId) {
      body.user_id = derivedUserId;
    } else {
      body.isAnonymous = true; // fallback
    }

    await postComment(body);
    setRootText("");
    load();
  }

  async function submitReply(parentId, text) {
    const body = {
      message: text,
      parent_comment_id: parentId,
      blog_id: kind === "blog" ? Number(entityId) : null,
      note_id: kind === "note" ? Number(entityId) : null,
    };
    if (postAnon) {
      body.isAnonymous = true;
    } else if (derivedUserId) {
      body.user_id = derivedUserId;
    } else {
      body.isAnonymous = true;
    }

    await postComment(body);
    setReplyingTo(null);
    load();
  }

  return (
    <section className="mt-10">
      <h3 className="text-lg font-semibold">Comments</h3>

      {/* New root comment */}
      <form onSubmit={submitRoot} className="mt-3 space-y-2 rounded-xl border border-gray-200 p-4">
        <label className="block text-sm font-medium text-gray-700">
          Add a comment {allowAnonymous && "(you can post anonymously)"}
        </label>
        <textarea
          value={rootText}
          onChange={(e) => setRootText(e.target.value)}
          placeholder="Write something…"
          className="w-full min-h-[90px] rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex items-center justify-between">
          {allowAnonymous && (
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={postAnon}
                onChange={(e) => setPostAnon(e.target.checked)}
              />
              Post anonymously
            </label>
          )}
          <button
            type="submit"
            className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50"
            disabled={!rootText.trim()}
          >
            Post
          </button>
        </div>
      </form>

      {/* Existing thread */}
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

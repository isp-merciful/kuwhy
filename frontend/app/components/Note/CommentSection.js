"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  EllipsisHorizontalIcon,
  PencilSquareIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

/* ---------------- utils ---------------- */
function fmtTime(ts) {
  try {
    const d = new Date(ts);
    return d.toLocaleString();
  } catch {
    return "";
  }
}

/* --------------- One Comment (recursive, FB-like) --------------- */
function CommentItem({
  comment,
  depth = 0,
  viewerId,
  onReply,
  onEdit,
  onDelete,
  goProfile,
}) {
  const mine = viewerId && String(viewerId) === String(comment.user_id);

  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(comment.message || "");
  const [showReplies, setShowReplies] = useState(false); // << ซ่อน/แสดง reply
  const [replyBox, setReplyBox] = useState(false);
  const [replyText, setReplyText] = useState("");

  const anchorRef = useRef(null);

  useEffect(() => {
    function close(e) {
      if (!anchorRef.current) return;
      if (!anchorRef.current.contains(e.target)) setMenuOpen(false);
    }
    if (menuOpen) document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

  const hasChildren = Array.isArray(comment.children) && comment.children.length > 0;

  const handleReply = () => {
    if (!replyText.trim()) return;
    onReply(replyText.trim(), comment.comment_id);
    setReplyText("");
    setReplyBox(false);
    setShowReplies(true); // โพสต์แล้วโชว์เธรดไว้เลย
  };

  return (
    <div
      className={`relative mt-3 ${depth > 0 ? "pl-4" : ""}`}
      style={depth > 0 ? { borderLeft: "2px solid rgba(0,0,0,0.05)" } : {}}
    >
      <div className="group flex items-start gap-3">
        {/* avatar → go profile */}
        <img
          src={comment.img || "/images/person2.png"}
          alt="avatar"
          className="h-9 w-9 rounded-full object-cover ring-2 ring-white shadow cursor-pointer"
          onClick={() => goProfile(comment.user_id)}
          onError={(e) => {
            if (e.currentTarget.src !== "/images/person2.png")
              e.currentTarget.src = "/images/person2.png";
          }}
        />

        <div className="min-w-0 flex-1 relative">
          {/* menu (owner only) */}
          {mine && !editing && (
            <button
              ref={anchorRef}
              onClick={() => setMenuOpen((v) => !v)}
              className="absolute right-0 -top-2 opacity-0 group-hover:opacity-100 transition rounded-full p-1 text-gray-500 hover:bg-gray-100"
              title="Options"
            >
              <EllipsisHorizontalIcon className="h-5 w-5" />
            </button>
          )}

          {/* bubble or editor */}
          {!editing ? (
            <div className="inline-block max-w-full rounded-2xl bg-gray-50 px-3.5 py-2 shadow-sm ring-1 ring-gray-200">
              <p className="text-[13px] leading-relaxed break-words">
                <button
                  onClick={() => goProfile(comment.user_id)}
                  className="mr-1 font-semibold text-gray-800 hover:underline"
                >
                  {comment.user_name || "anonymous"}
                </button>
                <span className="text-gray-800">{comment.message}</span>
              </p>
            </div>
          ) : (
            <div className="rounded-2xl bg-white ring-1 ring-gray-300 shadow-sm p-2">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={2}
                className="w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/40"
              />
              <div className="mt-2 flex gap-2">
                <button
                  onClick={async () => {
                    const ok = await onEdit(comment.comment_id, editText.trim());
                    if (ok) setEditing(false);
                  }}
                  disabled={!editText.trim()}
                  className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-3 py-1.5 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
                >
                  <CheckIcon className="h-4 w-4" />
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setEditText(comment.message || "");
                  }}
                  className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <XMarkIcon className="h-4 w-4" />
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* menu dropdown */}
          {mine && menuOpen && !editing && (
            <div className="absolute right-0 top-6 z-20 w-36 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  setEditing(true);
                  setEditText(comment.message || "");
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50"
              >
                <PencilSquareIcon className="h-4 w-4 text-gray-600" />
                Edit
              </button>
              <button
                onClick={async () => {
                  setMenuOpen(false);
                  await onDelete(comment.comment_id);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
              >
                <TrashIcon className="h-4 w-4" />
                Delete
              </button>
            </div>
          )}

          {/* meta row */}
          {!editing && (
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400">
              <span title={fmtTime(comment.created_at)}>{fmtTime(comment.created_at)}</span>
              <button
                onClick={() => setReplyBox((v) => !v)}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Reply
              </button>

              {/* toggle replies (facebook-like) */}
              {hasChildren && !showReplies && (
                <button
                  onClick={() => setShowReplies(true)}
                  className="text-gray-600 hover:text-gray-800"
                >
                  View replies ({comment.children.length})
                </button>
              )}
              {hasChildren && showReplies && (
                <button
                  onClick={() => setShowReplies(false)}
                  className="text-gray-600 hover:text-gray-800"
                >
                  Hide replies
                </button>
              )}
            </div>
          )}

          {/* reply box */}
          {replyBox && (
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply..."
                className="flex-1 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/40"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleReply();
                }}
              />
              <button
                onClick={handleReply}
                className="px-3 py-1.5 rounded-full bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
              >
                Send
              </button>
            </div>
          )}

          {/* replies (collapsed by default) */}
          {hasChildren && showReplies && (
            <div className="mt-2 space-y-2">
              {comment.children.map((ch) => (
                <CommentItem
                  key={ch.comment_id}
                  comment={ch}
                  depth={depth + 1}
                  viewerId={viewerId}
                  onReply={onReply}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  goProfile={goProfile}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------ Comment Section ------------------------ */
export default function CommentSection({ noteId, userId }) {
  const router = useRouter();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const listRef = useRef(null);

  if (!userId) {
    console.warn("userId is not available");
    return null;
  }

  const loadComments = async () => {
    if (!noteId) return;
    try {
      const res = await fetch(`http://localhost:8000/api/comment/note/${noteId}`);
      const data = await res.json();
      const tree = Array.isArray(data.comment) ? data.comment : [];
      setComments(tree);
    } catch (err) {
      console.error("❌ Fetch comments failed:", err);
    }
  };

  useEffect(() => {
    loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteId]);

  // profile: id -> handle and push
  const goProfile = async (uid) => {
    try {
      const res = await fetch(`http://localhost:8000/api/user/${uid}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Profile not found");
      const u = await res.json();
      const handle = (u?.login_name || u?.user_name || "").toString().toLowerCase().trim();
      if (!handle) throw new Error("Invalid handle");
      router.push(`/profile/${encodeURIComponent(handle)}`);
    } catch (e) {
      console.error("open profile failed:", e);
    }
  };

  // create comment / reply
  const handleSubmit = async (message, parentId = null) => {
    if (!message.trim() || !userId) return;

    try {
      const payload = {
        user_id: userId,
        message,
        note_id: noteId,
        parent_comment_id: parentId,
      };

      const res = await fetch("http://localhost:8000/api/comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to post comment");
      const commentData = await res.json();

      const newCommentId = commentData?.comment?.comment_id;
      if (!newCommentId) {
        console.error("❌ No insertId returned from comment API");
        return;
      }

      // best-effort notification
      try {
        await fetch("http://localhost:8000/api/noti", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sender_id: userId,
            note_id: noteId,
            comment_id: newCommentId,
            parent_comment_id: parentId,
          }),
        });
      } catch (err) {
        console.error("❌ Failed to send notification:", err);
      }

      await loadComments();

      if (!parentId && listRef.current) {
        listRef.current.scrollTop = listRef.current.scrollHeight;
      }
    } catch (err) {
      console.error("❌ Error posting comment:", err);
    }
  };

  // edit
  const handleEdit = async (commentId, newMessage) => {
    try {
      const res = await fetch("http://localhost:8000/api/comment", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment_id: Number(commentId), message: newMessage }),
      });
      if (!res.ok) throw new Error("Update failed");
      await loadComments();
      return true;
    } catch (e) {
      console.error("❌ update error:", e);
      return false;
    }
  };

  // delete
  const handleDelete = async (commentId) => {
    try {
      const res = await fetch(`http://localhost:8000/api/comment/${commentId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      await loadComments();
      return true;
    } catch (e) {
      console.error("❌ delete error:", e);
      return false;
    }
  };

  const onSendClick = () => {
    const msg = newComment.trim();
    if (!msg) return;
    handleSubmit(msg);
    setNewComment("");
  };

  return (
    <div className="rounded-2xl ring-1 ring-black/5 bg-white overflow-hidden">
      {/* list */}
      <div
        ref={listRef}
        className="max-h-80 overflow-y-auto px-3 py-3"
      >
        {comments.filter((c) => !c.parent_comment_id).length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-center text-sm text-gray-400">
            No comments yet
          </div>
        ) : (
          comments
            .filter((c) => !c.parent_comment_id)
            .map((c) => (
              <CommentItem
                key={c.comment_id}
                comment={c}
                viewerId={userId}
                onReply={handleSubmit}
                onEdit={handleEdit}
                onDelete={handleDelete}
                goProfile={goProfile}
              />
            ))
        )}
      </div>

      {/* composer: แยกสกรอลล์ออกจาก list */}
      <div className="border-t bg-white/95 backdrop-blur px-3 py-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="flex-1 rounded-full border border-gray-300 px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500/40"
            onKeyDown={(e) => {
              if (e.key === "Enter") onSendClick();
            }}
          />
          <button
            onClick={onSendClick}
            disabled={!newComment.trim()}
            className="rounded-full bg-blue-600 px-4 py-2 text-white font-medium shadow hover:bg-blue-700 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

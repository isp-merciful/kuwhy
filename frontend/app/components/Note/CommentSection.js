"use client";
import { useEffect, useState, useRef } from "react";

/* ------------ One Comment (recursive) ------------ */
function Comment({ comment, onReply }) {
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyText, setReplyText] = useState("");

  const handleReplySubmit = () => {
    if (!replyText.trim()) return;
    onReply(replyText, comment.comment_id);
    setReplyText("");
    setShowReplyBox(false);
  };

  return (
    <div className="mt-2">
      <div className="flex gap-3 items-start">
        <img
          src={comment.img || "/images/person2.png"}
          alt="avatar"
          className="w-9 h-9 rounded-full object-cover ring-2 ring-white shadow"
          onError={(e) => {
            if (e.currentTarget.src !== "/images/person2.png")
              e.currentTarget.src = "/images/person2.png";
          }}
        />
        <div className="min-w-0 flex-1">
          {/* bubble */}
          <div className="inline-block max-w-full rounded-2xl bg-gray-50 px-3.5 py-2 shadow-sm ring-1 ring-gray-200">
            <p className="text-[13px] leading-relaxed break-words">
              <span className="font-semibold text-gray-800 mr-1">
                {comment.user_name || "anonymous"}
              </span>
              <span className="text-gray-800">{comment.message}</span>
            </p>
          </div>

          {/* meta + actions */}
          <div className="mt-1.5 flex items-center gap-3 text-xs text-gray-400">
            <span>{new Date(comment.created_at).toLocaleString()}</span>
            <button
              onClick={() => setShowReplyBox((v) => !v)}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Reply
            </button>
          </div>

          {/* reply box */}
          {showReplyBox && (
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply..."
                className="flex-1 rounded-full border border-gray-300 bg-white px-3 py-1 text-sm outline-none focus:ring-2 focus:ring-blue-500/40"
              />
              <button
                onClick={handleReplySubmit}
                className="px-3 py-1 rounded-full bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
              >
                Send
              </button>
            </div>
          )}

          {/* children */}
          {comment.children?.length > 0 && (
            <div className="ml-6 mt-2 border-l-2 border-gray-100 pl-3 space-y-2">
              {comment.children.map((child) => (
                <Comment
                  key={child.comment_id}
                  comment={child}
                  onReply={onReply}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------ Comment Section ------------ */
export default function CommentSection({ noteId, userId }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const listRef = useRef(null);

  if (!userId) {
    console.warn("userId is not available");
    return null;
  }

  // fetch comments
  useEffect(() => {
    if (!noteId) return;

    const fetchComments = async () => {
      try {
        const res = await fetch(
          `http://localhost:8000/api/comment/note/${noteId}`
        );
        const data = await res.json();
        const tree = Array.isArray(data.comment) ? data.comment : [];
        setComments(tree);
        // console.log(`✅ Fetch comments successful for noteId: ${noteId}`);
      } catch (err) {
        console.error("❌ Fetch comments failed:", err);
      }
    };

    fetchComments();
  }, [noteId]);

  // add new comment or reply
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

      // send notification (best-effort)
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

      // refresh
      const refresh = await fetch(
        `http://localhost:8000/api/comment/note/${noteId}`
      );
      const freshData = await refresh.json();
      const tree = Array.isArray(freshData.comment) ? freshData.comment : [];
      setComments(tree);

      // scroll to bottom for new root comment
      if (!parentId && listRef.current) {
        listRef.current.scrollTop = listRef.current.scrollHeight;
      }
    } catch (err) {
      console.error("❌ Error posting comment:", err);
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
      {/* list (own scroll area) */}
      <div
        ref={listRef}
        className="max-h-80 overflow-y-auto px-3 py-3 space-y-2"
      >
        {comments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-center text-sm text-gray-400">
            No comments yet
          </div>
        ) : (
          comments
            .filter((c) => !c.parent_comment_id)
            .map((c) => (
              <Comment key={c.comment_id} comment={c} onReply={handleSubmit} />
            ))
        )}
      </div>

      {/* composer (separate, never scrolls with list) */}
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

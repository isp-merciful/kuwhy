"use client";
import { useEffect, useState, useRef } from "react";

// recursive comment component
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
    <div className="ml-4 mt-2">
      <div className="flex gap-3 items-start">
        <img
          src={comment.img || "/images/person2.png"}
          alt="avatar"
          className="w-8 h-8 rounded-full object-cover"
        />
        <div className="flex-1">
          <p className="text-sm">
            <span className="font-semibold text-gray-800 mr-1">
              {comment.user_name || "anonymous"}
            </span>
            {comment.message}
          </p>
          <span className="text-gray-400 text-xs">
            {new Date(comment.created_at).toLocaleString()}
          </span>

          <div>
            <button
              onClick={() => setShowReplyBox(!showReplyBox)}
              className="text-blue-500 text-xs font-medium mt-1"
            >
              Reply
            </button>
          </div>

          {showReplyBox && (
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply..."
                className="flex-1 border rounded-full px-3 py-1 text-sm"
              />
              <button
                onClick={handleReplySubmit}
                className="px-3 py-1 bg-blue-500 text-white rounded-full text-sm"
              >
                Send
              </button>
            </div>
          )}
        </div>
      </div>

      {/* render children comments */}
      {comment.children?.length > 0 &&
        comment.children.map((child) => (
          <Comment key={child.comment_id} comment={child} onReply={onReply} />
        ))}
    </div>
  );
}

export default function CommentSection({ noteId, userId }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const containerRef = useRef(null);
  if (!userId) {
    console.warn("userId is not available");
    return null; 
  }

  // fetch comments
  useEffect(() => {
    if (!noteId) return;

    const fetchComments = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/comment/note/${noteId}`);
        const data = await res.json();
        const tree = Array.isArray(data.comment) ? data.comment : [];
        setComments(tree);
        console.log(`✅ Fetch comments successful for noteId: ${noteId}`);
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

      const newCommentId = commentData?.comment?.insertId;
      if (!newCommentId) {
        console.error("❌ No insertId returned from comment API");
        return;
      }

      // send notification
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
        console.log("📩 Notification sent");
      } catch (err) {
        console.error("❌ Failed to send notification:", err);
      }

      // reload comments
      const refresh = await fetch(`http://localhost:8000/api/comment/note/${noteId}`);
      const freshData = await refresh.json();
      const tree = Array.isArray(freshData.comment) ? freshData.comment : [];
      setComments(tree);

      // scroll to new root comment
      if (!parentId && containerRef.current) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
      }
    } catch (err) {
      console.error("❌ Error posting comment:", err);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* scrollable comments */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto pr-2 space-y-2"
      >
        {comments.length === 0 && (
          <p className="text-gray-400 text-sm text-center">
            No comments yet
          </p>
        )}

        {comments.map((c) => {
          if (!c.parent_comment_id) {
            return <Comment key={c.comment_id} comment={c} onReply={handleSubmit} />;
          }
          return null;
        })}
      </div>

      {/* sticky input */}
      <div className="mt-2 pt-2 border-t flex gap-2 sticky bottom-0 bg-white z-10">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          className="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          onClick={() => {
            handleSubmit(newComment);
            setNewComment("");
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition"
        >
          Send
        </button>
      </div>
    </div>
  );
}

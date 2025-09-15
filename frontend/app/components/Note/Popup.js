"use client";
import CommentSection from "./CommentSection";
import MessageInput from "./MessageInput";
import Avatar from "./Avatar";
import UserNameEditor from "./UserNameEditor";

export default function Popup({
  showPopup,
  setShowPopup,
  text,
  name,
  isPosted,
  noteId,
}) {
  if (!showPopup) return null;

  const authorId = localStorage.getItem("userId");

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/10 backdrop-blur-sm z-50">
      <div className="relative bg-white rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex justify-end p-4">
          <button
            onClick={() => setShowPopup(false)}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ✕
          </button>
        </div>

        {/* Note content */}
        <div className="p-4 border-b flex flex-col items-center space-y-2">
          <MessageInput text={text} setText={() => {}} isPosted={isPosted} />
          <Avatar />
          <UserNameEditor name={name} setName={() => {}} isPosted={isPosted} />
        </div>

        {/* Comment Section */}
        <div className="p-4 flex-1 overflow-y-auto">
          {noteId && (
            <CommentSection noteId={noteId} authorId={authorId} />
          )}
        </div>
      </div>
    </div>
  );
}

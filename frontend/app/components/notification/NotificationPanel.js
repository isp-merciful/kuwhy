"use client";
import { useState } from "react";
import Popup from "../Note/Popup";

export default function NotificationPanel({ notifications }) {
  const [selectedNote, setSelectedNote] = useState(null);
  const [showPopup, setShowPopup] = useState(false);

  const handleClickNoti = async (noti) => {
    try {
      // mark as read
      if (!noti.is_read) {
        await fetch(`http://localhost:8000/api/noti/${noti.notification_id}`, {
          method: "PUT"
        });
        noti.is_read = true; // update local state
      }

      // fetch note content
      const res = await fetch(`http://localhost:8000/api/note/${noti.note_id}`);
      if (!res.ok) throw new Error("โหลด note ไม่สำเร็จ");
      const data = await res.json();

      setSelectedNote(data);
      setShowPopup(true);

    } catch (err) {
      console.error("❌ Failed to open note:", err);
    }
  };

  return (
    <>
      <div className="absolute right-0 mt-2 w-80 max-h-[70vh] overflow-y-auto bg-white shadow-lg rounded-xl p-3 z-50">
        <h3 className="font-bold mb-2">Notifications</h3>
        {notifications.length === 0 ? (
          <p className="text-gray-400 text-sm">ยังไม่มีการแจ้งเตือน</p>
        ) : (
          <ul className="space-y-2">
            {notifications.map(noti => (
              <li
                key={noti.notification_id}
                onClick={() => handleClickNoti(noti)}
                className={`cursor-pointer p-2 rounded-md flex items-center gap-2 ${
                  noti.is_read ? "bg-gray-100" : "bg-blue-50"
                } hover:bg-blue-100 transition`}
              >
                <img
                  src={noti.sender_img || "/images/person2.png"}
                  alt="avatar"
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div className="flex-1 text-sm">
                  <p>
                    <span className="font-semibold">{noti.sender_name}</span>{" "}
                    คอมเม้นโพสต์ของคุณ
                  </p>
                  <span className="text-gray-400 text-xs">
                    {new Date(noti.created_at).toLocaleString()}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {selectedNote && (
        <Popup
          showPopup={showPopup}
          setShowPopup={setShowPopup}
          noteId={selectedNote.note_id}
          text={selectedNote.message}
          name={selectedNote.user_name}
          isPosted={true}
          authorId={selectedNote.user_id}
        />
      )}
    </>
  );
}
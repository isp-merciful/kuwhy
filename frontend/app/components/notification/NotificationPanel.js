// frontend/app/components/notifications/NotificationPanel.js
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Popup from "../Note/Popup";
import useUserId from "../Note/useUserId"; // เหมือนที่ใช้ใน NoteBubble / NoteContainer

const API_BASE = "http://localhost:8000";

function formatDate(iso) {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("en-GB", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return new Date(iso).toLocaleString();
  }
}

// เลือกข้อความสำหรับ noti
function getNotiMessage(noti) {
  // reply comment
  if (noti.type === "reply") {
    return noti.blog_id
      ? "replied to your comment on your blog"
      : "replied to your comment";
  }

  // party events
  if (noti.type === "party_join") {
    return "joined your party";
  }
  if (noti.type === "party_chat") {
    return "sent a message in your party";
  }

  // comment
  if (noti.blog_id) {
    return "commented on your blog";
  }
  return "commented on your note";
}

export default function NotificationPanel({ notifications, onNotificationRead }) {
  const router = useRouter();
  const viewerUserId = useUserId(); // user id ของคนที่เปิด panel

  const [popupNote, setPopupNote] = useState(null);
  const [showPopup, setShowPopup] = useState(false);

  // ----- helper: โหลด note แล้วแสดงเป็น Popup (สำหรับ reply เท่านั้น) -----
  const openReplyPopup = async (noteId) => {
    try {
      const res = await fetch(`${API_BASE}/api/note/${noteId}`);
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(
          `โหลด note ไม่สำเร็จ (${res.status}) ${txt.substring(0, 100)}`
        );
      }
      const data = await res.json();
      setPopupNote(data);
      setShowPopup(true);
    } catch (err) {
      console.error("❌ Failed to open note from notification:", err);
    }
  };

  // ----- helper: สั่งให้ NoteBubble เข้าโหมด composing -----
  const openNoteBubbleComposing = () => {
    // ไปหน้า /note พร้อม query ให้ NoteBubble เปิด composing
    router.push("/note?openCompose=1");
  };

  const handleClickNoti = async (noti) => {
    try {
      // 1) mark as read
      if (!noti.is_read) {
        const res = await fetch(
          `${API_BASE}/api/noti/${noti.notification_id}`,
          { method: "PUT" }
        );

        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          console.error("❌ mark read failed:", res.status, txt);
        } else if (typeof onNotificationRead === "function") {
          onNotificationRead(noti.notification_id);
        }
      }

      // 2) ตัดสิน flow ตาม type

      // 2.1 blog notification → ไปหน้า blog
      if (noti.blog_id) {
        router.push(`/blog/${noti.blog_id}`);
        return;
      }

      // ไม่มี note_id / blog_id ก็ไปไหนไม่ได้
      if (!noti.note_id) {
        console.warn(
          "notification ไม่มี note_id หรือ blog_id ให้ตามต่อ",
          noti
        );
        return;
      }

      // 2.2 reply บน note (เคส: มีคน reply comment ของเราใน note คนอื่น)
      if (noti.type === "reply") {
        await openReplyPopup(noti.note_id);
        return;
      }

      // 2.3 โน้ตของเรา + party events → ให้ไปที่ NoteBubble โหมด composing
      if (
        noti.type === "comment" ||
        noti.type === "party_chat" ||
        noti.type === "party_join"
      ) {
        openNoteBubbleComposing();
        return;
      }

      // 2.4 type อื่น ๆ (fallback) → ใช้ popup แบบ reply ไปก่อน
      await openReplyPopup(noti.note_id);
    } catch (err) {
      console.error("❌ Failed to open from notification:", err);
    }
  };

  return (
    <>
      {/* ตัว Notification panel ใต้ icon กระดิ่ง */}
      <div className="w-80 max-h-[70vh] overflow-y-auto bg-white shadow-lg rounded-xl p-3">
        <h3 className="font-bold mb-2">Notifications</h3>

        {notifications.length === 0 ? (
          <p className="text-gray-400 text-sm">No notifications yet.</p>
        ) : (
          <ul className="space-y-2">
            {notifications.map((noti) => (
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
                  <p className="leading-snug">
                    <span className="font-semibold">{noti.sender_name}</span>{" "}
                    {getNotiMessage(noti)}
                  </p>
                  <span className="text-gray-400 text-xs">
                    {formatDate(noti.created_at)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Popup ตอบ reply → อยู่กลางจอเสมอ */}
      {showPopup && popupNote && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30">
          <div className="w-full max-w-3xl px-4">
            <Popup
              showPopup={showPopup}
              setShowPopup={setShowPopup}
              noteId={popupNote.note_id}
              text={popupNote.message}
              name={popupNote.user_name}
              maxParty={popupNote.max_party ?? 0}
              currParty={popupNote.crr_party ?? 0}
              ownerId={popupNote.user_id}
              viewerUserId={viewerUserId} // ✅ ส่ง user id ของคนที่เปิด popup
              onAfterJoin={() => {
                // ให้ NoteBubble refresh note ถ้ามี join ผ่าน popup
                try {
                  if (typeof window !== "undefined") {
                    window.dispatchEvent(
                      new CustomEvent("kuwhy-active-note-changed", {
                        detail: {
                          noteId: popupNote.note_id,
                          userId: viewerUserId,
                          source: "notification-popup",
                        },
                      })
                    );
                  }
                } catch (e) {
                  console.error(
                    "dispatch kuwhy-active-note-changed failed:",
                    e
                  );
                }
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}

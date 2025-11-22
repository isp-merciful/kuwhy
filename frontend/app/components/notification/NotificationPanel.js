"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import Popup from "../Note/Popup";
import useUserId from "../Note/useUserId";

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

function getNotiMessage(noti) {
  if (noti.type === "reply") {
    return noti.blog_id
      ? "replied to your comment on your blog"
      : "replied to your comment";
  }

  if (noti.type === "party_join") return "joined your party";
  if (noti.type === "party_chat") return "sent a message in your party";

  if (noti.blog_id) return "commented on your blog";
  return "commented on your note";
}

export default function NotificationPanel({
  notifications,
  onNotificationRead,
  onPopupOpenChange, 
}) {
  const router = useRouter();
  const viewerUserId = useUserId();

  const [popupNote, setPopupNote] = useState(null);
  const [showPopup, setShowPopup] = useState(false);

  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (typeof onPopupOpenChange === "function") {
      onPopupOpenChange(showPopup);
    }
  }, [showPopup, onPopupOpenChange]);

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

  const openNoteBubbleComposing = () => {
    router.push("/note?openCompose=1");
  };

  const handleClickNoti = async (noti) => {
    try {
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

      if (noti.blog_id) {
        router.push(`/blog/${noti.blog_id}`);
        return;
      }

      if (!noti.note_id) {
        console.warn("notification ไม่มี note_id หรือ blog_id", noti);
        return;
      }

      if (noti.type === "reply") {
        await openReplyPopup(noti.note_id);
        return;
      }

      if (
        noti.type === "comment" ||
        noti.type === "party_chat" ||
        noti.type === "party_join"
      ) {
        openNoteBubbleComposing();
        return;
      }

      await openReplyPopup(noti.note_id);
    } catch (err) {
      console.error("❌ Failed to open from notification:", err);
    }
  };

  return (
    <>
      <div
        className="w-80 bg-white shadow-lg rounded-xl p-3"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-bold mb-2">Notifications</h3>

        <div className="mt-2 max-h-[60vh] overflow-y-auto">
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
                      <span className="font-semibold">
                        {noti.sender_name}
                      </span>{" "}
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
      </div>

      {isClient &&
        showPopup &&
        popupNote &&
        createPortal(
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[70]">
            <Popup
              showPopup={showPopup}
              setShowPopup={setShowPopup}
              noteId={popupNote.note_id}
              text={popupNote.message}
              name={popupNote.user_name}
              isPosted={true}
              maxParty={popupNote.max_party || 0}
              currParty={popupNote.crr_party || 0}
              ownerId={popupNote.user_id}
              viewerUserId={viewerUserId}
              onAfterJoin={() => {
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
          </div>,
          document.body
        )}
    </>
  );
}

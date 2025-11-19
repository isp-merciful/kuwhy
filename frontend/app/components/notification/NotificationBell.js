"use client";

import { useState, useEffect, useRef } from "react";
import NotificationPanel from "./NotificationPanel";

const API_BASE = "http://localhost:8000";

/**
 * Props (optional)
 * - isOpen: boolean
 * - onOpenChange: (open:boolean) => void
 */
export default function NotificationBell({ isOpen, onOpenChange }) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = typeof isOpen === "boolean" ? isOpen : internalOpen;
  const setOpen =
    typeof onOpenChange === "function" ? onOpenChange : setInternalOpen;

  const [notifications, setNotifications] = useState([]);
  const [userId, setUserId] = useState("");
  const rootRef = useRef(null);

  // ✅ track ว่าตอนนี้ popup จาก NotificationPanel เปิดอยู่ไหม
  const [popupOpen, setPopupOpen] = useState(false);

  useEffect(() => {
    try {
      const id = localStorage.getItem("userId");
      if (id) setUserId(id);
    } catch (e) {
      console.warn("read userId from localStorage failed:", e);
    }
  }, []);

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    const fetchNotifications = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/noti/${userId}`, {
          cache: "no-store",
        });
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          console.error("❌ Fetch notifications failed:", res.status, txt);
          return;
        }
        const data = await res.json();
        if (!cancelled) {
          setNotifications(
            Array.isArray(data.notifications) ? data.notifications : []
          );
        }
      } catch (err) {
        if (!cancelled) {
          console.error("❌ Fetch notifications failed:", err);
        }
      }
    };

    fetchNotifications();
    const intervalId = setInterval(fetchNotifications, 15000);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [userId]);

  // ปิดเมื่อคลิกนอก + Escape
  useEffect(() => {
    if (!open) return;

    function onDocClick(e) {
      // ✅ ถ้า popup เปิดอยู่ ให้ไม่ปิด panel
      if (popupOpen) return;

      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    function onEsc(e) {
      // ✅ กด Esc ตอน popup เปิดอยู่ ก็ไม่ปิด panel เช่นกัน
      if (popupOpen) return;
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open, setOpen, popupOpen]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleNotificationRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.notification_id === id ? { ...n, is_read: true } : n
      )
    );
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition"
        aria-expanded={open}
        aria-haspopup="true"
        title="Notifications"
      >
        {/* bell icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-gray-700"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 z-50">
          <NotificationPanel
            notifications={notifications}
            onNotificationRead={handleNotificationRead}
            // ✅ ให้ panel แจ้งสถานะ popup กลับมาที่ bell
            onPopupOpenChange={setPopupOpen}
          />
        </div>
      )}
    </div>
  );
}

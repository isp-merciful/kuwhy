"use client";
import { useState, useEffect } from "react";
import NotificationPanel from "./NotificationPanel";

export default function NotificationBell() {
  const [showPanel, setShowPanel] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [userId, setUserId] = useState("");

  useEffect(() => {
    const id = localStorage.getItem("userId");
    if (id) setUserId(id);
  }, []);

  useEffect(() => {
    if (!userId) return;
    const fetchNotifications = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/noti/${userId}`);
        const data = await res.json();
        setNotifications(data.notifications || []);
      } catch (err) {
        console.error("❌ Fetch notifications failed:", err);
      }
    };
    fetchNotifications();
  }, [userId]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="relative">
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition"
      >
        {/* SVG Bell */}
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

      {showPanel && <NotificationPanel notifications={notifications} />}
    </div>
  );
}
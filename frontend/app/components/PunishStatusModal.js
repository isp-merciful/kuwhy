"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import useUserId from "../components/Note/useUserId";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

export default function PunishStatusModal() {
  const { data: session, status } = useSession();
  const anonUserId = useUserId(); // anonymous user_id ที่ใช้โพสต์ note/comment
  const [open, setOpen] = useState(false);
  const [info, setInfo] = useState(null);
  const checkedRef = useRef(false);

  useEffect(() => {
    if (checkedRef.current) return;

    async function check() {
      try {
        let res = null;

        // 🔑 เคส login → เช็กด้วย /api/punish/me + Bearer token
        if (status === "authenticated" && session?.apiToken) {
          res = await fetch(`${API_BASE}/api/punish/me`, {
            headers: {
              Authorization: `Bearer ${session.apiToken}`,
            },
            cache: "no-store",
          });
        }
        // 👤 เคส anonymous → ใช้ user_id จาก useUserId() เรียก /api/punish/public
        else if (anonUserId) {
          const qs = new URLSearchParams({ user_id: anonUserId });
          res = await fetch(
            `${API_BASE}/api/punish/public?${qs.toString()}`,
            {
              cache: "no-store",
            }
          );
        } else {
          return;
        }

        if (!res || !res.ok) return;

        const data = await res.json().catch(() => null);
        if (data?.active) {
          setInfo(data);
          setOpen(true);
        }
      } catch (e) {
        console.error("check punish failed:", e);
      } finally {
        checkedRef.current = true;
      }
    }

    check();
  }, [status, session, anonUserId]);

  if (!open) return null;

  const mainPunish = info?.punishments?.[0] || null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="max-w-md rounded-2xl bg-white p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-red-600">
          You are currently restricted
        </h2>

        <p className="mt-2 text-sm text-gray-700">
          {mainPunish?.reason ||
            info?.message ||
            "You are temporarily restricted from posting notes, blogs, and comments."}
        </p>

        {mainPunish?.expires_at && (
          <p className="mt-2 text-xs text-gray-500">
            Active until{" "}
            {new Date(mainPunish.expires_at).toLocaleString("en-GB", {
              timeZone: "Asia/Bangkok",
            })}
          </p>
        )}

        <div className="mt-4 flex justify-end">
          <button
            onClick={() => setOpen(false)}
            className="rounded-md bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

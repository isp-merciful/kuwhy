"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import useUserId from "./Note/useUserId"; 

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

export default function PunishStatusModal() {
  const { data: session, status } = useSession();
  const anonUserId = useUserId(); 

  const [open, setOpen] = useState(false);
  const [info, setInfo] = useState(null);

  const [checkedLogin, setCheckedLogin] = useState(false);
  const [checkedAnon, setCheckedAnon] = useState(false);

  useEffect(() => {
    if (status === "loading") return;

    if (status !== "authenticated") return;

    if (!session?.apiToken) return;

    if (checkedLogin) return;

    let cancelled = false;

    async function run() {
      try {
        const res = await fetch(`${API_BASE}/api/punish/me`, {
          headers: {
            Authorization: `Bearer ${session.apiToken}`,
          },
          cache: "no-store",
        });

        if (!res.ok) {
          console.warn("punish/me not ok:", res.status);
          return;
        }

        const data = await res.json().catch(() => null);
        if (!cancelled && data?.active) {
          setInfo(data);
          setOpen(true);
        }
      } catch (e) {
        console.error("check punish/me failed:", e);
      } finally {
        if (!cancelled) {
          setCheckedLogin(true);
        }
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [status, session, checkedLogin]);

  useEffect(() => {
    if (status === "authenticated") return;

    if (!anonUserId) return;

    if (checkedAnon) return;

    let cancelled = false;

    async function run() {
      try {
        const qs = new URLSearchParams({ user_id: anonUserId });
        const res = await fetch(
          `${API_BASE}/api/punish/public?${qs.toString()}`,
          {
            cache: "no-store",
          }
        );

        if (!res.ok) {
          console.warn("punish/public not ok:", res.status);
          return;
        }

        const data = await res.json().catch(() => null);
        if (!cancelled && data?.active) {
          setInfo(data);
          setOpen(true);
        }
      } catch (e) {
        console.error("check punish/public failed:", e);
      } finally {
        if (!cancelled) {
          setCheckedAnon(true);
        }
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [status, anonUserId, checkedAnon]);

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

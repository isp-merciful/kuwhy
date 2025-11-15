"use client";

import { useEffect, useState, useMemo } from "react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ||
  process.env.API_BASE ||
  "http://localhost:8000";

export default function LikeButton({ blogId, initialUp = 0, initialDown = 0 }) {
  const [up, setUp] = useState(initialUp ?? 0);
  const [down, setDown] = useState(initialDown ?? 0);
  const [mine, setMine] = useState(null); // "up" | "down" | null
  const [loading, setLoading] = useState(false);

  const lsKey = useMemo(() => `blogVote:${blogId}`, [blogId]);

  useEffect(() => {
    try {
      const v = localStorage.getItem(lsKey);
      setMine(v === "up" || v === "down" ? v : null);
    } catch {}
  }, [lsKey]);

  const nextState = (action) => (mine === action ? null : action);

  async function doVote(action) {
    if (loading || !blogId) return;
    setLoading(true);

    const prev = mine;
    const next = nextState(action);

    const snap = { up, down, mine };
    if (prev !== next) {
      if (prev === null && next === "up")       { setUp(v => v + 1); setMine("up"); }
      else if (prev === null && next === "down"){ setDown(v => v + 1); setMine("down"); }
      else if (prev === "up" && next === null)  { setUp(v => Math.max(0, v - 1)); setMine(null); }
      else if (prev === "down" && next === null){ setDown(v => Math.max(0, v - 1)); setMine(null); }
      else if (prev === "up" && next === "down"){ setUp(v => Math.max(0, v - 1)); setDown(v => v + 1); setMine("down"); }
      else if (prev === "down" && next === "up"){ setDown(v => Math.max(0, v - 1)); setUp(v => v + 1); setMine("up"); }
    }

    try {
      const res = await fetch(`${API_BASE}/api/blog/${blogId}/vote-simple`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prev, next }),
      });
      if (!res.ok) throw new Error(`Vote failed (${res.status})`);
      const data = await res.json();

      if (typeof data.blog_up === "number") setUp(data.blog_up);
      if (typeof data.blog_down === "number") setDown(data.blog_down);
      setMine(data.vote ?? null);

      try {
        if (data.vote) localStorage.setItem(lsKey, data.vote);
        else localStorage.removeItem(lsKey);
      } catch {}
    } catch (e) {
      setUp(snap.up); setDown(snap.down); setMine(snap.mine);
      console.error(e);
      alert(e.message || "Vote failed");
    } finally {
      setLoading(false);
    }
  }

  const activeUp = mine === "up";
  const activeDown = mine === "down";

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => doVote("up")}
        disabled={loading}
        className={`rounded-md border px-3 py-1 hover:bg-gray-50 disabled:opacity-60 ${activeUp ? "font-semibold" : ""}`}
        aria-pressed={activeUp}
        aria-label="Like this post"
        title="Like (tap again to undo)"
      >
        👍 {up}
      </button>
      <button
        onClick={() => doVote("down")}
        disabled={loading}
        className={`rounded-md border px-3 py-1 hover:bg-gray-50 disabled:opacity-60 ${activeDown ? "font-semibold" : ""}`}
        aria-pressed={activeDown}
        aria-label="Dislike this post"
        title="Dislike (tap again to undo)"
      >
        👎 {down}
      </button>
    </div>
  );
}

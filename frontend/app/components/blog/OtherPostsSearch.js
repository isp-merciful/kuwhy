"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

export default function OtherPostsSearch({ posts = [] }) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return posts;
    return posts.filter((p) => (p.blog_title || "").toLowerCase().includes(s));
  }, [q, posts]);

  // show only 3 when no search; show all matches when searching
  const visible = useMemo(() => {
    const s = q.trim();
    return s ? filtered : filtered.slice(0, 3);
  }, [q, filtered]);

  const total = filtered.length;
  const shown = q ? visible.length : Math.min(3, total);

  return (
    <div className="sticky top-6 rounded-3xl border border-emerald-100 bg-white/80 backdrop-blur p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-emerald-900">Other Posts</h2>
        {total > 0 && (
          <span className="text-xs text-emerald-700/70">
            {shown}/{total}
          </span>
        )}
      </div>

      {/* Search Box */}
      <div className="mt-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by title…"
          className="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm text-emerald-900 outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 bg-white/80 placeholder-emerald-700/40 shadow-sm"
        />
      </div>

      {/* Results */}
      {visible.length === 0 ? (
        <p className="mt-4 text-sm text-emerald-700/70">
          {q ? "No matches." : "No posts yet."}
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {visible.map((p) => (
            <li key={p.blog_id} className="group">
              <Link
                href={`/blog/${p.blog_id}`}
                className="block rounded-2xl border border-transparent px-3 py-2 hover:border-emerald-200 hover:bg-white/50 transition-colors"
              >
                <div className="line-clamp-1 font-medium text-emerald-900 group-hover:underline">
                  {p.blog_title || "(untitled)"}
                </div>
                <div className="mt-0.5 text-xs text-emerald-700/70">
                  {p.user_name ?? "anonymous"}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {/* Optional: See all link */}
      {!q && total > 3 && (
        <div className="mt-4 text-right">
          <Link
            href="/blog"
            className="text-xs text-emerald-700 hover:text-emerald-900 underline transition-colors"
          >
            See all
          </Link>
        </div>
      )}
    </div>
  );
}

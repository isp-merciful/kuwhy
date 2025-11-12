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

  return (
    <div className="sticky top-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Other posts</h2>
        <span className="text-xs text-gray-500">
          {q ? `${visible.length}/${filtered.length}` : `3/${filtered.length}`}
        </span>
      </div>

      {/* Search box */}
      <div className="mt-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by title…"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
        />
      </div>

      {/* Results */}
      {visible.length === 0 ? (
        <p className="mt-3 text-sm text-gray-600">
          {q ? "No matches." : "No posts yet."}
        </p>
      ) : (
        <ul className="mt-3 space-y-3">
          {visible.map((p) => (
            <li key={p.blog_id} className="group">
              <Link
                href={`/blog/${p.blog_id}`}
                className="block rounded-md border border-transparent p-2 hover:border-gray-200 hover:bg-gray-50"
              >
                <div className="line-clamp-1 font-medium group-hover:underline">
                  {p.blog_title || "(untitled)"}
                </div>
                <div className="mt-0.5 text-xs text-gray-500">
                  {p.user_name ?? "anonymous"}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {/* Optional: link to all posts when not searching */}
      {!q && filtered.length > 3 && (
        <div className="mt-3 text-right">
          <Link href="/blog" className="text-xs text-blue-600 underline">
            See all
          </Link>
        </div>
      )}
    </div>
  );
}

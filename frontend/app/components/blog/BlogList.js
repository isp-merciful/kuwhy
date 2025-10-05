"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function BlogList({ initialBlogs = [] }) {
  const [blogs, setBlogs] = useState(initialBlogs);
  
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("http://localhost:8000/api/blog", {
          cache: "no-store",
        });
        const json = await res.json();
        setBlogs(Array.isArray(json) ? json : json?.data ?? []);
      } catch (e) {
        console.error("Failed to fetch blogs", e);
      }
    })();
  }, []);

  if (!blogs?.length) {
    return <div className="text-gray-500">No posts yet.</div>;
  }

  return (
    <div className="space-y-4">
      {blogs.map((b) => (
        <div
          key={b.blog_id}
          className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
        >
          {/* Clickable area to open the post page */}
          <Link href={`/blog/${b.blog_id}`} className="block group">
            <h3 className="font-semibold text-[15px] group-hover:underline">
              {b.blog_title}
            </h3>
            <p className="mt-1 text-sm text-gray-700 line-clamp-3">
              {b.message}
            </p>
          </Link>

          <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
            <button
              type="button"
              className="rounded-md border px-2 py-1 text-gray-700 hover:bg-gray-50"
            >
              Reply
            </button>
            <span>👍 {b.blog_up ?? 0}</span>
            <span>👎 {b.blog_down ?? 0}</span>
            <span className="ml-auto">
              by {b.user_name ?? "anonymous"} ·{" "}
              {b.created_at ? new Date(b.created_at).toLocaleString() : ""}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

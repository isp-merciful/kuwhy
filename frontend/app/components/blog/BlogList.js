"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Avatar from "../Note/Avatar";

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
    <>
      {/* Soft green glow animation */}
      <style>
        {`
        @keyframes softGlow {
          0%, 100% {
            box-shadow: 0 0 10px rgba(52, 211, 153, 0.35),
                        0 0 18px rgba(110, 231, 183, 0.25);
          }
          50% {
            box-shadow: 0 0 16px rgba(52, 211, 153, 0.55),
                        0 0 28px rgba(110, 231, 183, 0.4);
          }
        }
        `}
      </style>

      <div className="space-y-4">
        {blogs.map((b) => (
          <div
            key={b.blog_id}
            className="rounded-2xl p-[2px] bg-gradient-to-r from-emerald-300 via-teal-300 to-sky-300 shadow-sm hover:shadow-md transition-all"
          >
            <div className="bg-white rounded-2xl px-5 py-4">

              <div className="flex items-start gap-5">

                {/* LEFT: Avatar with soft glowing ring */}
                <div className="flex-shrink-0 flex items-start h-full">
                  <div
                    className="inline-flex items-center justify-center rounded-full p-[6px]"
                    style={{
                      background:
                        "linear-gradient(135deg, #34d399, #6ee7b7, #a7f3d0)",
                      animation: "softGlow 2.6s ease-in-out infinite",
                    }}
                  >
                    <div className="rounded-full overflow-hidden bg-white">
                      <Avatar
                        size={96}
                        seed={b.user_id ?? b.user_name ?? "anon"}
                      />
                    </div>
                  </div>
                </div>

                {/* RIGHT CONTENT */}
                <div className="flex-1">

                  <Link href={`/blog/${b.blog_id}`} className="block group">
                    <h3
                      className="font-bold text-[20px] sm:text-[22px] text-gray-900
                                 group-hover:text-emerald-700 group-hover:underline
                                 group-hover:drop-shadow-sm transition-all"
                    >
                      {b.blog_title}
                    </h3>
                  </Link>

                  <div className="text-xs text-gray-600 mt-1">
                    posted by{" "}
                    <span className="font-medium text-emerald-700">
                      {b.user_name ?? "anonymous"}
                    </span>
                  </div>

                  <div className="border-b border-gray-200 my-3"></div>

                  <Link href={`/blog/${b.blog_id}`} className="block group">
                    <p className="text-sm text-gray-700 leading-relaxed line-clamp-4">
                      {b.message}
                    </p>
                  </Link>

                  <div className="mt-4 flex items-center gap-3 text-xs text-gray-500">

                    <button
                      type="button"
                      className="rounded-md border border-emerald-100 px-3 py-1 text-gray-700
                                 hover:bg-emerald-50 transition-colors"
                    >
                      Reply
                    </button>

                    <span>👍 {b.blog_up ?? 0}</span>
                    <span>👎 {b.blog_down ?? 0}</span>

                    <span className="ml-auto opacity-80">
                      {b.created_at ? new Date(b.created_at).toLocaleString() : ""}
                    </span>

                  </div>

                </div>

              </div>

            </div>
          </div>
        ))}
      </div>
    </>
  );
}

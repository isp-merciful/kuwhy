"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Avatar from "../Note/Avatar";

const MAX_PREVIEW_CHARS = 120; // limit preview text length
const SOFT_BREAK_EVERY = 80;  // force break every 80 chars

// Insert invisible soft-break every N characters (fix long long word overflow)
function insertSoftBreaks(text, every = SOFT_BREAK_EVERY) {
  if (!text) return "";
  const re = new RegExp(`(.{${every}})`, "g");
  return text.replace(re, "$1\u200B");
}

export default function BlogList({ initialBlogs = [] }) {
  const [blogs, setBlogs] = useState(initialBlogs);
  const searchParams = useSearchParams();

  // raw tag query from URL: e.g. "homework,food"
  const rawTagQuery = searchParams.get("tag") || "";

  // normalize filter tags: ["homework", "food"]
  const filterTags = rawTagQuery
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

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

  // Normalize blogs: ensure tags array + lowercase version for matching
  const normalized = blogs.map((b) => {
    const tags =
      Array.isArray(b.tags)
        ? b.tags
        : typeof b.tags === "string"
        ? b.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [];

    const tagsLower = tags.map((t) => t.toLowerCase());

    return { ...b, tags, tagsLower };
  });

  // Apply AND filter: blog must contain *all* selected tags
  let filteredBlogs = normalized;

  if (filterTags.length > 0) {
    filteredBlogs = normalized.filter((b) =>
      filterTags.every((ft) => b.tagsLower.includes(ft))
    );
  }

  // Pretty label for "Showing posts tagged …"
  const humanTagLabel =
    filterTags.length === 0
      ? ""
      : filterTags.length === 1
      ? `#${filterTags[0]}`
      : filterTags.map((t) => `#${t}`).join(", ");

  return (
    <>
      {/* Soft glow animation */}
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

      {/* Active Tag Filter banner */}
      {filterTags.length > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
          <span>
            Showing posts tagged <span className="font-semibold">{humanTagLabel}</span>
          </span>
          <Link
            href="/blog"
            className="ml-auto text-xs underline hover:text-emerald-900"
          >
            Clear filter
          </Link>
        </div>
      )}

      <div className="space-y-4">
        {filteredBlogs.map((b) => {
          const fullMessage = b.message || "";

          // Short preview
          let previewMessage =
            fullMessage.length > MAX_PREVIEW_CHARS
              ? fullMessage.slice(0, MAX_PREVIEW_CHARS) + "…"
              : fullMessage;

          // Fix long single-word overflow
          previewMessage = insertSoftBreaks(previewMessage);

          return (
            <div
              key={b.blog_id}
              className="rounded-2xl p-[2px] bg-gradient-to-r from-emerald-300 via-teal-300 to-sky-300 shadow-sm hover:shadow-md transition-all"
            >
              <div className="bg-white rounded-2xl px-5 py-4">
                <div className="flex items-start gap-5">
                  {/* LEFT Avatar */}
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
                    {/* Title */}
                    <Link href={`/blog/${b.blog_id}`} className="block group">
                      <h3
                        className="font-bold text-[20px] sm:text-[22px] text-gray-900 
                                   group-hover:text-emerald-700 group-hover:underline transition-all"
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

                    {/* PREVIEW MESSAGE */}
                    <Link href={`/blog/${b.blog_id}`} className="block group">
                      <p className="text-sm text-gray-700 leading-relaxed break-words whitespace-pre-wrap">
                        {previewMessage}
                      </p>
                    </Link>

                    {/* TAGS */}
                    {b.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                        {b.tags.map((tag) => (
                          <Link
                            key={tag}
                            href={`/blog?tag=${encodeURIComponent(tag)}`}
                            className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-emerald-700 hover:bg-emerald-100"
                          >
                            #{tag}
                          </Link>
                        ))}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="mt-4 flex items-center gap-3 text-xs text-gray-500">
                      <button
                        type="button"
                        className="rounded-md border border-emerald-100 px-3 py-1 hover:bg-emerald-50"
                      >
                        Reply
                      </button>

                      <span>👍 {b.blog_up ?? 0}</span>
                      <span>👎 {b.blog_down ?? 0}</span>

                      <span className="ml-auto opacity-80">
                        {b.created_at
                          ? new Date(b.created_at).toLocaleString()
                          : ""}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* No posts match tags */}
        {filterTags.length > 0 && filteredBlogs.length === 0 && (
          <div className="text-sm text-gray-500 mt-4">
            No posts found for tag(s) <b>{humanTagLabel}</b>.
          </div>
        )}
      </div>
    </>
  );
}

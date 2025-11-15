"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import LikeButtons from "../../components/blog/LikeButtons";
import CommentThread from "../../components/comments/CommentThread";
import OtherPostsSearch from "../../components/blog/OtherPostsSearch";

/* ---------------------- API base ---------------------- */

const API_BASE = "http://localhost:8000";

/* ---------------------- helpers ---------------------- */

function toAbs(url) {
  if (!url) return "";
  return url.startsWith("http") ? url : `${API_BASE}${url}`;
}

function formatDate(iso) {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("en-GB-u-ca-gregory", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: "Asia/Bangkok",
    }).format(new Date(iso));
  } catch {
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, "0");
    return (
      `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(
        d.getUTCDate()
      )} ` +
      `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(
        d.getUTCSeconds()
      )} UTC`
    );
  }
}

async function fetchJSON(url) {
  try {
    const res = await fetch(url, { cache: "no-store" });

    if (!res.ok) {
      if (process.env.NODE_ENV !== "production") {
        console.error("fetchJSON failed:", res.status, url);
      }
      return null;
    }

    return await res.json();
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.error("fetchJSON error:", err, "url:", url);
    }
    return null;
  }
}

function normalizeOne(json) {
  if (!json) return null;

  if (json.data && !Array.isArray(json.data)) return json.data;
  if (json.blog && !Array.isArray(json.blog)) return json.blog;
  if (json.post && !Array.isArray(json.post)) return json.post;
  if (Array.isArray(json)) return json[0] ?? null;

  return json;
}

function normalizeMany(json) {
  if (!json) return [];
  if (Array.isArray(json)) return json;
  if (Array.isArray(json.data)) return json.data;
  if (Array.isArray(json.blogs)) return json.blogs;
  if (Array.isArray(json.blog)) return json.blog;
  if (Array.isArray(json.posts)) return json.posts;
  return [];
}

async function fetchPost(id) {
  const candidates = [
    `${API_BASE}/api/blog/${encodeURIComponent(id)}`,
    `${API_BASE}/api/blog?id=${encodeURIComponent(id)}`,
  ];

  for (const u of candidates) {
    const one = normalizeOne(await fetchJSON(u));
    if (one) return one;
  }
  return null;
}

async function fetchAllPosts() {
  return normalizeMany(await fetchJSON(`${API_BASE}/api/blog`));
}

/* ---------------------- page component (client) ---------------------- */

export default function BlogPostPage({ params }) {
  const id = params?.id;

  const [post, setPost] = useState(null);
  const [allPosts, setAllPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [p, list] = await Promise.all([fetchPost(id), fetchAllPosts()]);
        if (cancelled) return;
        setPost(p);
        setAllPosts(list);
      } catch (e) {
        if (cancelled) return;
        console.error("load blog error:", e);
        setError("Failed to load post");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl py-10">
        <div className="mb-4">
          <Link href="/blog" className="text-sm text-gray-600 hover:underline">
            ← Back to Community Blog
          </Link>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-1/3 bg-gray-200 rounded" />
          <div className="h-4 w-1/4 bg-gray-200 rounded" />
          <div className="h-40 w-full bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl py-10">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-gray-600">{error}</p>
        <Link
          href="/blog"
          className="mt-4 inline-block text-sm text-blue-600 underline"
        >
          ← Back to Community Blog
        </Link>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="mx-auto max-w-2xl py-10">
        <h1 className="text-xl font-semibold">Post not found</h1>
        <p className="mt-2 text-gray-600">
          We couldn&apos;t find a blog post with ID <code>{id}</code>.
        </p>
        <Link
          href="/blog"
          className="mt-4 inline-block text-sm text-blue-600 underline"
        >
          ← Back to Community Blog
        </Link>
      </div>
    );
  }

  const otherPosts = (Array.isArray(allPosts) ? allPosts : [])
    .filter((p) => String(p.blog_id) !== String(id))
    .slice(0, 8);

  let rawAtts = post.attachments;
  if (typeof rawAtts === "string") {
    try {
      rawAtts = JSON.parse(rawAtts);
    } catch {
      rawAtts = [];
    }
  }
  const atts = Array.isArray(rawAtts) ? rawAtts : [];

  return (
    <div className="mx-auto max-w-5xl py-10">
      <div className="mb-4">
        <Link href="/blog" className="text-sm text-gray-600 hover:underline">
          ← Back to Community Blog
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main article */}
        <article className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <header>
            <h1 className="text-2xl font-bold">{post.blog_title}</h1>
            <div className="mt-2 text-sm text-gray-500">
              by {post.user_name ?? "anonymous"} ·{" "}
              <time dateTime={post.created_at}>
                {post.created_at ? formatDate(post.created_at) : ""}
              </time>
            </div>
          </header>

          <section className="prose mt-4 max-w-none">
            <p className="whitespace-pre-wrap">{post.message}</p>
          </section>

          {/* Attachments */}
          {(atts.length > 0 || post.file_url) && (
            <section className="mt-6">
              <h3 className="text-sm font-semibold text-gray-700">
                Attachments
              </h3>

              {atts.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {atts.map((att, idx) => {
                    const url = toAbs(att.url);
                    const isImg = (att.type || "").startsWith("image/");
                    return (
                      <li
                        key={idx}
                        className="rounded-md border border-gray-200 p-3"
                      >
                        {isImg ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={url}
                            alt={att.name || `attachment-${idx}`}
                            className="max-h-80 w-auto rounded"
                          />
                        ) : (
                          <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            download
                            className="text-blue-600 underline break-all"
                          >
                            {att.name || url}
                          </a>
                        )}
                        {att.size ? (
                          <div className="text-xs text-gray-500 mt-1">
                            {(att.size / 1024).toFixed(1)} KB
                          </div>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              )}

              {post.file_url && !post.attachments && (
                <div className="mt-3 rounded-md border border-gray-200 p-3">
                  <a
                    href={toAbs(post.file_url)}
                    target="_blank"
                    rel="noreferrer"
                    download
                    className="text-blue-600 underline break-all"
                  >
                    Download attachment
                  </a>
                </div>
              )}
            </section>
          )}

          {/* Likes / Dislikes */}
          <footer className="mt-6 flex items-center gap-4 text-sm text-gray-700">
            <LikeButtons
              blogId={post.blog_id}
              initialUp={post.blog_up ?? 0}
              initialDown={post.blog_down ?? 0}
            />
          </footer>

          {/* Comments */}
          <CommentThread blogId={post.blog_id} />
        </article>

        {/* Sidebar: Other posts (with search) */}
        <aside className="lg:col-span-1">
          <OtherPostsSearch posts={otherPosts} />
        </aside>
      </div>
    </div>
  );
}

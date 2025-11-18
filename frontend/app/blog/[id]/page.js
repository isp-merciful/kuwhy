"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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

export default function BlogPostPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id; // string ของ [id]

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
      <div className="mx-auto max-w-5xl px-4 pt-24 pb-10">
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
      <div className="mx-auto max-w-2xl px-4 pt-24 pb-10">
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
      <div className="mx-auto max-w-2xl px-4 pt-24 pb-10">
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
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-green-50 to-emerald-100 pt-28 pb-12 px-4">
      {/* Back button */}
      <div className="max-w-5xl mx-auto mb-6">
        <button
          type="button"
          onClick={() => router.push("/blog")}
          className="relative z-[60] inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-900 transition-colors"
        >
          <span className="text-xl leading-none">←</span>
          <span>Back</span>
        </button>
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* ----- MAIN POST CARD ----- */}
        <article className="lg:col-span-2 rounded-3xl border border-emerald-100 bg-white/80  px-8 py-8 shadow-sm">
          {/* Header */}
          <header>
            <h1 className="text-2xl sm:text-3xl font-bold text-emerald-900">
              {post.blog_title}
            </h1>

            <div className="mt-2 text-sm text-emerald-700/80">
              by{" "}
              <span className="font-semibold">
                {post.user_name ?? "anonymous"}
              </span>{" "}
              ·{" "}
              <time dateTime={post.created_at}>
                {post.created_at ? formatDate(post.created_at) : ""}
              </time>
            </div>
          </header>

          {/* Message */}
          <section className="prose mt-5 max-w-none text-emerald-900">
            <p className="whitespace-pre-wrap">{post.message}</p>
          </section>

          {/* ----- ATTACHMENTS ----- */}
          {(atts.length > 0 || post.file_url) && (
            <section className="mt-8">
              <h3 className="text-sm font-semibold text-emerald-700 mb-2">
                Attachments
              </h3>

              {atts.length > 0 && (
                <ul className="space-y-3">
                  {atts.map((att, idx) => {
                    const url = toAbs(att.url);
                    const isImg = (att.type || "").startsWith("image/");
                    return (
                      <li
                        key={idx}
                        className="rounded-2xl border border-emerald-100 bg-white/70 p-4 shadow-sm"
                      >
                        {isImg ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={url}
                            alt={att.name || `image-${idx}`}
                            className="max-h-80 w-auto rounded-xl border border-emerald-100"
                          />
                        ) : (
                          <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            download
                            className="text-emerald-700 underline break-all"
                          >
                            {att.name || url}
                          </a>
                        )}

                        {att.size && (
                          <div className="text-xs text-emerald-700/70 mt-1">
                            {(att.size / 1024).toFixed(1)} KB
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}

              {post.file_url && !post.attachments && (
                <div className="rounded-2xl border border-emerald-100 bg-white/70 p-4 shadow-sm">
                  <a
                    href={toAbs(post.file_url)}
                    target="_blank"
                    rel="noreferrer"
                    download
                    className="text-emerald-700 underline break-all"
                  >
                    Download attachment
                  </a>
                </div>
              )}
            </section>
          )}

          {/* Likes */}
          <footer className="mt-8 text-emerald-900">
            <LikeButtons
              blogId={post.blog_id}
              initialUp={post.blog_up ?? 0}
              initialDown={post.blog_down ?? 0}
            />
          </footer>

          {/* Comments */}
          <div className="mt-10">
            <CommentThread blogId={post.blog_id} />
          </div>
        </article>

        {/* ----- SIDEBAR SEARCH CARD ----- */}
        <aside className="lg:col-span-1">
          <div className="rounded-3xl border border-emerald-100 bg-white/80 p-6 shadow-sm">
            <OtherPostsSearch posts={otherPosts} />
          </div>
        </aside>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
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

  // session จาก next-auth (ใช้เช็ค owner + apiToken)
  const { data: session } = useSession();
  const apiToken = session?.apiToken || null;
  const currentUserId = session?.user?.id || session?.user?.user_id || null;

  const [post, setPost] = useState(null);
  const [allPosts, setAllPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editMessage, setEditMessage] = useState("");
  const [editTags, setEditTags] = useState(""); // comma separated
  const [editAttachments, setEditAttachments] = useState([]); // attachments to keep
  const [newFiles, setNewFiles] = useState([]); // File[]
  const [saving, setSaving] = useState(false);

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

  // เมื่อ post เปลี่ยน → sync เข้า edit state
  useEffect(() => {
    if (!post) return;

    setEditTitle(post.blog_title || "");
    setEditMessage(post.message || "");

    const tagStr = Array.isArray(post.tags)
      ? post.tags.join(", ")
      : typeof post.tags === "string"
      ? post.tags
      : "";
    setEditTags(tagStr);

    const atts =
      typeof post.attachments === "string"
        ? (() => {
            try {
              const arr = JSON.parse(post.attachments);
              return Array.isArray(arr) ? arr : [];
            } catch {
              return [];
            }
          })()
        : Array.isArray(post.attachments)
        ? post.attachments
        : [];

    setEditAttachments(atts);
    setNewFiles([]);
  }, [post]);

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

  // sidebar posts
  const otherPosts = (Array.isArray(allPosts) ? allPosts : [])
    .filter((p) => String(p.blog_id) !== String(id))
    .slice(0, 8);

  // attachments for view mode
  let rawAtts = post.attachments;
  if (typeof rawAtts === "string") {
    try {
      rawAtts = JSON.parse(rawAtts);
    } catch {
      rawAtts = [];
    }
  }
  const atts = Array.isArray(rawAtts) ? rawAtts : [];
  const displayAtts = isEditing ? editAttachments : atts;

  // tags (for view mode)
  const tagList = Array.isArray(post.tags)
    ? post.tags
    : typeof post.tags === "string"
    ? post.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  // owner check
  const isOwner =
    currentUserId &&
    post.user_id &&
    String(currentUserId) === String(post.user_id);

  function handleRemoveAttachment(idx) {
    setEditAttachments((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleNewFilesChange(e) {
    const files = Array.from(e.target.files || []);
    setNewFiles(files);
  }

  function handleCancelEdit() {
    setIsEditing(false);
    // reset back to current post values
    setEditTitle(post.blog_title || "");
    setEditMessage(post.message || "");
    const tagStr = Array.isArray(post.tags)
      ? post.tags.join(", ")
      : typeof post.tags === "string"
      ? post.tags
      : "";
    setEditTags(tagStr);
    const currentAtts = Array.isArray(atts) ? atts : [];
    setEditAttachments(currentAtts);
    setNewFiles([]);
  }

  async function handleSaveEdit() {
    if (!isOwner) {
      alert("You are not allowed to edit this post.");
      return;
    }
    if (!apiToken) {
      alert("Please log in again before editing this post.");
      return;
    }

    const title = editTitle.trim();
    const message = editMessage.trim();
    const tags = editTags;

    if (!title || !message) {
      alert("Title and message cannot be empty.");
      return;
    }

    try {
      setSaving(true);

      const form = new FormData();
      form.append("blog_title", title);
      form.append("message", message);
      form.append("tags", tags || "");
      // ส่ง attachments ที่จะเก็บไว้เป็น JSON
      form.append("attachments_json", JSON.stringify(editAttachments));

      // แนบไฟล์ใหม่ (ถ้ามี)
      for (const f of newFiles) {
        form.append("attachments", f);
      }

      const res = await fetch(`${API_BASE}/api/blog/${post.blog_id}`, {
        method: "PUT",
        headers: {
          // important: อย่าใส่ Content-Type เอง เวลาใช้ FormData
          Authorization: `Bearer ${apiToken}`,
        },
        body: form,
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Update failed:", res.status, text);
        alert(`Failed to update post (${res.status}).`);
        return;
      }

      const updated = await res.json();
      setPost(updated);
      setIsEditing(false);
    } catch (err) {
      console.error("Update error:", err);
      alert("Unexpected error while updating the post.");
    } finally {
      setSaving(false);
    }
  }

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
        <article className="lg:col-span-2 rounded-3xl border border-emerald-100 bg-white/80 px-8 py-8 shadow-sm">
          {/* Header */}
          <header>
            {/* title */}
            {isEditing ? (
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xl sm:text-2xl font-semibold text-emerald-900 outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
                placeholder="Edit title..."
              />
            ) : (
              <h1 className="text-2xl sm:text-3xl font-bold text-emerald-900">
                {post.blog_title}
              </h1>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-emerald-700/80">
              <span>
                by{" "}
                <span className="font-semibold">
                  {post.user_name ?? "anonymous"}
                </span>
              </span>
              <span>·</span>
              <time dateTime={post.created_at}>
                {post.created_at ? formatDate(post.created_at) : ""}
              </time>

              {isOwner && !isEditing && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="ml-auto rounded-full border border-emerald-200 px-3 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50 transition-colors"
                >
                  Edit post
                </button>
              )}
            </div>

            {/* tags */}
            {isEditing ? (
              <div className="mt-3">
                <label className="block text-xs font-semibold text-emerald-700/80 mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  placeholder="homework, cat, exam"
                  className="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm text-emerald-900 outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
                />
              </div>
            ) : (
              tagList.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {tagList.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() =>
                        router.push(`/blog?tag=${encodeURIComponent(tag)}`)
                      }
                      className="inline-flex items-center rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100 hover:border-emerald-200 transition-colors"
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              )
            )}

            {/* edit action buttons */}
            {isOwner && isEditing && (
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="inline-flex items-center rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? "Saving..." : "Save changes"}
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={saving}
                  className="inline-flex items-center rounded-xl border border-emerald-200 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </header>

          {/* Message */}
          <section className="prose mt-5 max-w-none text-emerald-900">
            {isEditing ? (
              <textarea
                value={editMessage}
                onChange={(e) => setEditMessage(e.target.value)}
                className="w-full min-h-[200px] rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm text-emerald-900 outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
                placeholder="Edit your content..."
              />
            ) : (
              <p className="whitespace-pre-wrap">{post.message}</p>
            )}
          </section>

          {/* ----- ATTACHMENTS (view + edit) ----- */}
          {(displayAtts.length > 0 || post.file_url || (isEditing && true)) && (
            <section className="mt-8">
              <h3 className="text-sm font-semibold text-emerald-700 mb-2">
                Attachments
              </h3>

              {displayAtts.length > 0 && (
                <ul className="space-y-3">
                  {displayAtts.map((att, idx) => {
                    const url = toAbs(att.url);
                    const isImg = (att.type || "").startsWith("image/");
                    return (
                      <li
                        key={att.url || idx}
                        className="rounded-2xl border border-emerald-100 bg-white/70 p-4 shadow-sm flex flex-col gap-2"
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

                        <div className="flex items-center justify-between text-xs text-emerald-700/70">
                          {att.size && (
                            <span>{(att.size / 1024).toFixed(1)} KB</span>
                          )}

                          {isEditing && (
                            <button
                              type="button"
                              onClick={() => handleRemoveAttachment(idx)}
                              className="rounded-full border border-red-200 px-2 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}

              {/* legacy single file_url (view only) */}
              {post.file_url && !post.attachments && !isEditing && (
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

              {/* file input for new attachments (edit mode) */}
              {isEditing && (
                <div className="mt-4 space-y-2">
                  <label className="block text-xs font-semibold text-emerald-700/80">
                    Add more attachments
                  </label>
                  <input
                    type="file"
                    multiple
                    onChange={handleNewFilesChange}
                    className="block w-full text-xs text-emerald-900"
                  />
                  {newFiles.length > 0 && (
                    <ul className="mt-1 text-xs text-emerald-700/80 list-disc list-inside">
                      {newFiles.map((f, idx) => (
                        <li key={idx}>
                          {f.name} ({(f.size / 1024).toFixed(1)} KB)
                        </li>
                      ))}
                    </ul>
                  )}
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

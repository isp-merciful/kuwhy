"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
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
  const id = params?.id; // [id] from URL

  const { data: session } = useSession();

  // ⭐ use the SAME token as /blog/new page
  const apiToken = session?.apiToken || null;

  const authHeaders = useMemo(
    () => (apiToken ? { Authorization: `Bearer ${apiToken}` } : {}),
    [apiToken]
  );

  const currentUserId =
    session?.user?.id || session?.user?.user_id || null;

  const [post, setPost] = useState(null);
  const [allPosts, setAllPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // edit state
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [draftTitle, setDraftTitle] = useState("");
  const [draftMessage, setDraftMessage] = useState("");
  const [draftTags, setDraftTags] = useState(""); // "tag1, tag2"
  const [draftAtts, setDraftAtts] = useState([]); // kept attachments
  const [newFiles, setNewFiles] = useState([]); // File[]

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

  // sync drafts when we enter edit mode
  useEffect(() => {
    if (!post || !isEditing) return;
    setDraftTitle(post.blog_title || "");
    setDraftMessage(post.message || "");
    const tagsStr = Array.isArray(post.tags) ? post.tags.join(", ") : "";
    setDraftTags(tagsStr);
    setDraftAtts(Array.isArray(post.attachments) ? post.attachments : []);
    setNewFiles([]);
  }, [post, isEditing]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 pt-24 pb-10">
        <div className="mb-4">
          <button
            onClick={() => router.push("/blog")}
            className="text-sm text-gray-600 hover:underline"
          >
            ← Back to Community Blog
          </button>
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
        <button
          onClick={() => router.push("/blog")}
          className="mt-4 inline-block text-sm text-blue-600 underline"
        >
          ← Back to Community Blog
        </button>
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
        <button
          onClick={() => router.push("/blog")}
          className="mt-4 inline-block text-sm text-blue-600 underline"
        >
          ← Back to Community Blog
        </button>
      </div>
    );
  }

  const isOwner =
    currentUserId &&
    post.user_id &&
    String(currentUserId) === String(post.user_id);

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

  const tagList = Array.isArray(post.tags)
    ? post.tags
    : typeof post.tags === "string"
    ? post.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  /* ------- edit handlers ------- */

  function startEdit() {
    if (!isOwner) return;
    setDraftTitle(post.blog_title || "");
    setDraftMessage(post.message || "");
    const tagsStr = Array.isArray(post.tags) ? post.tags.join(", ") : "";
    setDraftTags(tagsStr);
    setDraftAtts(Array.isArray(post.attachments) ? post.attachments : []);
    setNewFiles([]);
    setIsEditing(true);
  }

  function cancelEdit() {
    setIsEditing(false);
    setNewFiles([]);
  }

  function handleNewFiles(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setNewFiles((prev) => [...prev, ...files]);
    e.target.value = "";
  }

  function removeExistingAttachment(idx) {
    setDraftAtts((prev) => prev.filter((_, i) => i !== idx));
  }

  function removeNewFile(idx) {
    setNewFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSave() {
    if (!post) return;

    if (!apiToken) {
      alert("Session expired. Please login again to edit this post.");
      router.push(`/login?callbackUrl=/blog/${post.blog_id}`);
      return;
    }

    try {
      setSaving(true);
      const formData = new FormData();
      formData.append("blog_title", draftTitle || "");
      formData.append("message", draftMessage || "");
      formData.append("tags", draftTags || "");
      formData.append("attachments_json", JSON.stringify(draftAtts));
      for (const file of newFiles) {
        formData.append("attachments", file);
      }

      const res = await fetch(`${API_BASE}/api/blog/${post.blog_id}`, {
        method: "PUT",
        body: formData,
        credentials: "include",
        headers: {
          ...authHeaders, // Bearer apiToken
        },
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Update failed: ${res.status} ${text}`);
      }

      const updated = await res.json();
      setPost(updated);
      setAllPosts((prev) =>
        Array.isArray(prev)
          ? prev.map((b) =>
              b.blog_id === updated.blog_id ? { ...b, ...updated } : b
            )
          : prev
      );
      setIsEditing(false);
      setNewFiles([]);
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to update post");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!post || !isOwner) return;

    if (!apiToken) {
      alert("Session expired. Please login again to delete this post.");
      router.push(`/login?callbackUrl=/blog/${post.blog_id}`);
      return;
    }

    const ok = window.confirm(
      "Are you sure you want to delete this post? This action cannot be undone."
    );
    if (!ok) return;

    try {
      setDeleting(true);
      const res = await fetch(`${API_BASE}/api/blog/${post.blog_id}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          ...authHeaders, // Bearer apiToken
        },
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Delete failed: ${res.status} ${text}`);
      }
      router.push("/blog");
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to delete post");
    } finally {
      setDeleting(false);
    }
  }

  /* ------- render ------- */

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
          <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              {isEditing ? (
                <input
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  className="w-full rounded-xl border border-emerald-200 px-3 py-2 text-xl font-semibold text-emerald-900 outline-none focus:ring-2 focus:ring-emerald-400"
                  placeholder="Post title"
                />
              ) : (
                <h1 className="text-2xl sm:text-3xl font-bold text-emerald-900">
                  {post.blog_title}
                </h1>
              )}

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

              {/* Tags */}
              {isEditing ? (
                <div className="mt-3">
                  <label className="block text-xs font-semibold text-emerald-700 mb-1">
                    Tags (comma separated)
                  </label>
                  <input
                    value={draftTags}
                    onChange={(e) => setDraftTags(e.target.value)}
                    placeholder="homework, quiz, project"
                    className="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm text-emerald-900 outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
              ) : tagList.length > 0 ? (
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
              ) : null}
            </div>

            {/* Owner controls */}
            {isOwner && (
              <div className="flex flex-wrap gap-2">
                {isEditing ? (
                  <>
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={saving}
                      className="rounded-xl bg-emerald-500 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow hover:bg-emerald-600 disabled:opacity-60"
                    >
                      {saving ? "Saving…" : "Save changes"}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      disabled={saving}
                      className="rounded-xl border border-emerald-200 px-4 py-2 text-xs sm:text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={startEdit}
                      className="rounded-xl border border-emerald-200 px-4 py-2 text-xs sm:text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
                    >
                      Edit post
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={deleting}
                      className="rounded-xl border border-red-200 px-4 py-2 text-xs sm:text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
                    >
                      {deleting ? "Deleting…" : "Delete"}
                    </button>
                  </>
                )}
              </div>
            )}
          </header>

          {/* Message */}
          <section className="prose mt-5 max-w-none text-emerald-900">
            {isEditing ? (
              <textarea
                value={draftMessage}
                onChange={(e) => setDraftMessage(e.target.value)}
                className="w-full min-h-[180px] rounded-xl border border-emerald-200 px-4 py-3 text-sm text-emerald-900 outline-none focus:ring-2 focus:ring-emerald-400"
                placeholder="Write your post…"
              />
            ) : (
              <p className="whitespace-pre-wrap">{post.message}</p>
            )}
          </section>

          {/* Attachments (view + edit) */}
          {(atts.length > 0 || post.file_url || isEditing) && (
            <section className="mt-8">
              <h3 className="text-sm font-semibold text-emerald-700 mb-2">
                Attachments
              </h3>

              {/* View mode */}
              {!isEditing && (
                <>
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
                </>
              )}

              {/* Edit mode attachments */}
              {isEditing && (
                <div className="space-y-4">
                  {/* existing attachments with remove */}
                  {draftAtts.length > 0 && (
                    <ul className="space-y-3">
                      {draftAtts.map((att, idx) => {
                        const url = toAbs(att.url);
                        const isImg = (att.type || "").startsWith("image/");
                        return (
                          <li
                            key={idx}
                            className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-white/70 p-4 shadow-sm"
                          >
                            <div className="flex-1">
                              {isImg ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={url}
                                  alt={att.name || `image-${idx}`}
                                  className="max-h-40 w-auto rounded-xl border border-emerald-100"
                                />
                              ) : (
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noreferrer"
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
                            </div>
                            <button
                              type="button"
                              onClick={() => removeExistingAttachment(idx)}
                              className="text-xs rounded-full border border-red-200 px-3 py-1 text-red-600 hover:bg-red-50"
                            >
                              Remove
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}

                  {/* new files list */}
                  {newFiles.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-emerald-700">
                        New files to upload:
                      </div>
                      <ul className="space-y-1 text-xs text-emerald-800">
                        {newFiles.map((f, idx) => (
                          <li
                            key={idx}
                            className="flex items-center justify-between gap-2"
                          >
                            <span className="truncate">
                              {f.name} ({(f.size / 1024).toFixed(1)} KB)
                            </span>
                            <button
                              type="button"
                              onClick={() => removeNewFile(idx)}
                              className="rounded-full border border-red-200 px-2 py-0.5 text-[11px] text-red-600 hover:bg-red-50"
                            >
                              Remove
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* file input */}
                  <div className="text-xs text-emerald-700/80">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-emerald-200 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50">
                      <span>+ Add files</span>
                      <input
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleNewFiles}
                      />
                    </label>
                    <div className="mt-1 text-[11px] text-emerald-700/60">
                      You can remove existing files above, and add new ones
                      here.
                    </div>
                  </div>
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

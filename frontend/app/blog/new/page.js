"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

// Resolve API base (works with Docker too)
const API_BASE =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.API_BASE ||
  "http://localhost:8000";

// Helper: turn /uploads/... into http://localhost:8000/uploads/...
function toAbs(url) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  if (url.startsWith("/uploads/")) return `${API_BASE}${url}`;
  // frontend static assets like /images/pfp.png
  return url;
}

// Preset common tags
const PRESET_TAGS = ["homework", "health", "game", "anime", "food", "other"];

export default function NewBlogPage() {
  const router = useRouter();

  // --- session / token ---
  const { data: session, status } = useSession();
  const authed = status === "authenticated" && !!session?.user?.id;
  const ready = status !== "loading";


  const apiToken = authed ? session?.apiToken : null;

  const authHeaders = useMemo(
    () => (apiToken ? { Authorization: `Bearer ${apiToken}` } : {}),
    [apiToken]
  );

  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState([]); // File[]
  const [tagsInput, setTagsInput] = useState(""); // free-typed tags
  const [presetTags, setPresetTags] = useState([]); // selected preset tags

  //username
  const displayName =
    session?.user?.name ||
    session?.user?.login_name ||
    "anonymous";

  // user profile image
  const rawAvatar = session?.user?.image || "";
  const avatarImg = rawAvatar ? toAbs(rawAvatar) : "";

  // preview สำหรับรูป
  const imagePreviews = useMemo(
    () =>
      files
        .filter((f) => f.type.startsWith("image/"))
        .map((f) => ({
          name: f.name,
          url: URL.createObjectURL(f),
        })),
    [files]
  );

  // if finished loading but no authed → go to login
  useEffect(() => {
    if (ready && !authed) {
      router.push("/login?callbackUrl=/blog/new");
    }
  }, [ready, authed, router]);

  const canSubmit =
    title.trim().length > 0 &&
    detail.trim().length > 0 &&
    authed &&
    ready &&
    !loading;

  const handleFiles = (e) => {
    const fl = Array.from(e.target.files || []);
    setFiles(fl);
  };

  const togglePresetTag = (tag) => {
    setPresetTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleCreate = async () => {
    if (!canSubmit) return;

    if (!apiToken) {
      alert(
        "Your session has expired or you don’t have permission. Please log in again before posting a blog."
      );
      router.push("/login?callbackUrl=/blog/new");
      return;
    }

    setLoading(true);
    try {
      //  
      const userId = session?.user?.id || session?.user?.user_id;

      const fd = new FormData();
      fd.append("blog_title", title.trim());
      fd.append("message", detail.trim());

      // collect tags from free input + preset buttons 
      const manualTags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const combinedTags = Array.from(
        new Set([...manualTags, ...presetTags]) // unique
      );

      if (combinedTags.length > 0) {
        // send as comma-separated string
        fd.append("tags", combinedTags.join(","));
      }

      files.forEach((f) => fd.append("attachments", f));

      
      const res = await fetch(`${API_BASE}/api/blog`, {
        method: "POST",
        credentials: "include",
        headers: {
          // use FormData instead of manual Content-Type
          ...(authHeaders || {}),
        },
        body: fd,
      });

      if (!res.ok) {
        // read body first
        let raw = "";
        let data = null;
        try {
          raw = await res.text();
          try {
            data = JSON.parse(raw);
          } catch {
            // if json not working try reading as text
          }
        } catch {
          // if still failed let it go for now
        }

        // 🔒 In case of get punish from ensureNotPunished
        if (res.status === 403 && data && data.code === "PUNISHED") {
          alert(
            data.error ||
              "Your account is currently restricted from creating blogs. Your blog was not posted."
          );
          return;
        }

        console.error("create blog failed:", res.status, raw);
        alert("Failed to create blog. Please try again.");
        return;
      }

      router.push("/blog");
    } catch (e) {
      console.error("create blog error:", e);
      alert("Failed to create blog. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-green-50 to-emerald-100">
      <section className="relative isolate overflow-hidden py-10 sm:py-12 min-h-screen">
        {/* Decorative hero blobs */}
        <div className="pointer-events-none absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl">
          <div className="mx-auto h-72 w-[36rem] bg-gradient-to-r from-emerald-300/40 via-green-300/40 to-lime-300/40 opacity-70" />
        </div>

        <div className="max-w-4xl mx-auto px-4">
          {/* Back button */}
          <button
            onClick={() => router.push("/blog")}
            className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-900 transition-colors mt-24 mb-6"
          >
            <span className="text-xl leading-none">←</span>
            <span>Back</span>
          </button>

          {/* Title */}
          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-emerald-900">
              Create Q&amp;A Post
            </h2>
            <p className="mt-1 text-sm text-emerald-700/80">
              Share your question with the KUWHY community.
            </p>
          </div>

          {/* User / title input card */}
          <div className="rounded-3xl border border-emerald-100 bg-white/80 shadow-sm px-6 py-5 sm:px-8 sm:py-6 flex flex-col items-center gap-4 mb-8">
            <div className="flex items-center gap-4">
              {/* ✅ ีuser real img from DB if available, if not fallback to first alphabet of username */}
              {avatarImg ? (
                <img
                  src={avatarImg}
                  alt={displayName}
                  className="w-16 h-16 rounded-full object-cover border border-emerald-200 bg-emerald-50"
                  onError={(e) => {
                    if (e.currentTarget.src !== "/images/pfp.png") {
                      e.currentTarget.src = "/images/pfp.png";
                    }
                  }}
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-lg font-semibold text-emerald-700">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}

              <div>
                <div className="text-xs uppercase tracking-wide text-emerald-500 font-semibold">
                  Posting as
                </div>
                <div className="text-base font-semibold text-emerald-900 text-center sm:text-left">
                  {displayName}
                </div>
              </div>
            </div>

            {/* Title input */}
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Add your title..."
              className="bg-emerald-500 text-white placeholder-white/70 rounded-3xl px-6 py-4 w-full 
                         shadow-inner text-center sm:text-left
                         focus:ring-4 focus:ring-emerald-300 outline-none transition"
            />
          </div>

          {/* Main Form Card */}
          <div className="bg-white/80  rounded-3xl border border-emerald-100 shadow-md px-8 py-7">
            {/* Detail text area */}
            <label className="block text-sm font-semibold text-emerald-800 mb-2">
              Details
            </label>
            <textarea
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="Write more details about your question..."
              rows={8}
              className="w-full bg-white border border-emerald-100 rounded-xl p-4 
                         outline-none text-gray-800 placeholder-gray-400
                         focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition"
            />

            {/* Tags Section */}
            <div className="mt-6">
              <label className="block text-sm font-semibold text-emerald-800 mb-2">
                Tags / Categories
              </label>

              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="Type custom tags, e.g. homework, exam"
                className="w-full rounded-xl border bg-white border-emerald-100 px-3 py-2 text-sm 
                           outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
              />

              <p className="mt-1 text-xs text-emerald-700/80">
                Separate multiple tags with commas.
              </p>

              {/* Preset tags */}
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                {PRESET_TAGS.map((tag) => {
                  const active = presetTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => togglePresetTag(tag)}
                      className={`inline-flex items-center rounded-full border px-3 py-1 transition ${
                        active
                          ? "bg-emerald-500 border-emerald-500 text-white shadow"
                          : "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                      }`}
                    >
                      #{tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* File upload */}
            <div className="mt-6">
              <label className="block text-sm font-semibold text-emerald-800 mb-2">
                Attach files
              </label>

              <input
                type="file"
                multiple
                onChange={handleFiles}
                className="block w-full text-sm text-gray-700 
                           file:mr-4 file:rounded-md file:border-0 
                           file:bg-emerald-50 file:px-3 file:py-2 file:text-sm file:font-medium 
                           hover:file:bg-emerald-100 transition"
              />

              {/* List + previews */}
              {files.length > 0 && (
                <div className="mt-4 rounded-xl border border-emerald-200 p-4 bg-emerald-50/50">
                  <div className="text-sm font-medium text-emerald-800 mb-2">
                    {files.length} file(s) selected
                  </div>

                  <ul className="space-y-1 text-sm text-emerald-900">
                    {files.map((f) => (
                      <li key={f.name}>
                        {f.name}
                        <span className="text-emerald-600/70">
                          {" "}
                          ({Math.round(f.size / 1024)} KB)
                        </span>
                      </li>
                    ))}
                  </ul>

                  {imagePreviews.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {imagePreviews.map((p) => (
                        <div
                          key={p.name}
                          className="rounded-xl overflow-hidden border border-emerald-200 shadow-sm"
                        >
                          <img
                            src={p.url}
                            alt={p.name}
                            className="w-full h-32 object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="flex justify-end mt-8">
              <button
                onClick={handleCreate}
                disabled={!canSubmit}
                className={`rounded-2xl px-6 py-3 text-sm font-semibold shadow-md transition 
                  ${
                    canSubmit
                      ? "bg-emerald-500 text-white hover:bg-emerald-600"
                      : "bg-emerald-200 text-white cursor-not-allowed"
                  }`}
              >
                {loading ? "Posting…" : "Post"}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

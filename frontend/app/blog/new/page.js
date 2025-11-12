"use client";
import { useEffect, useState, useMemo } from "react";
import Avatar from "../../components/Note/Avatar";
import useLocalStorage from "../../components/Note/useLocalStorage";

// Resolve API base (works with Docker too)
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ||
  process.env.API_BASE ||
  "http://localhost:8000";

export default function NewBlogPage() {
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useLocalStorage("userId", null);
  const [userName, setUserName] = useLocalStorage("userName", "anonymous");

  // NEW: attachments (multiple)
  const [files, setFiles] = useState([]); // File[]

  // Simple client-side previews for images only
  const imagePreviews = useMemo(() => {
    return files
      .filter((f) => f.type.startsWith("image/"))
      .map((f) => ({
        name: f.name,
        url: URL.createObjectURL(f),
      }));
  }, [files]);

  useEffect(() => {
    async function ensureUser() {
      try {
        let id = userId;
        if (!id) {
          id = crypto?.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random()}`;
          setUserId(id);
        }
        await fetch(`${API_BASE}/api/user`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: id, user_name: userName || "anonymous" }),
        });
      } catch {}
    }
    ensureUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canSubmit = title.trim() && detail.trim();

  const ensureUserNow = async () => {
    let id =
      userId ||
      (typeof window !== "undefined" ? localStorage.getItem("userId") : null);
    if (!id) {
      id = crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
      setUserId(id);
      if (typeof window !== "undefined")
        localStorage.setItem("userId", JSON.stringify(id));
    }
    try {
      await fetch(`${API_BASE}/api/user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: id, user_name: userName || "anonymous" }),
      });
    } catch {}
    return id;
  };

  // NEW: onChange for file input
  const handleFiles = (e) => {
    const fl = Array.from(e.target.files || []);
    setFiles(fl);
  };

  const handleCreate = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      const id = await ensureUserNow();

      // Send multipart/form-data instead of JSON
      const fd = new FormData();
      fd.append("user_id", id);
      fd.append("blog_title", title.trim());
      fd.append("message", detail.trim());
      // multiple attachments: backend should read "attachments"
      files.forEach((f) => fd.append("attachments", f));

      const res = await fetch(`${API_BASE}/api/blog`, {
        method: "POST",
        body: fd, // no Content-Type header; browser sets it (multipart boundary)
      });

      if (!res.ok) throw new Error("Create blog failed");
      window.location.href = "/blog";
    } catch (e) {
      console.error(e);
      alert("Failed to create blog. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <section className="relative isolate overflow-hidden py-12 bg-gradient-to-b from-[#DDF3FF] to-[#E8FFF2] min-h-screen">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6">Blog Q&A</h2>
          <div className="mb-4">
            <button
              onClick={() => (window.location.href = "/blog")}
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <span className="text-xl">←</span>
              <span>Back</span>
            </button>
          </div>

          <div className="flex items-start gap-6 mb-8">
            <Avatar center={false} size={24} />
            <div className="flex-1 max-w-2xl mx-auto">
              <div className="text-gray-500 mb-2 text-center">{userName}</div>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Add Your Title..."
                className="bg-[#54E0C7] placeholder-white/90 text-white rounded-3xl px-6 py-4 w-full shadow outline-none"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow px-6 py-5 border border-gray-200 max-w-4xl">
            <textarea
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="Add your detailed..."
              rows={8}
              className="w-full outline-none text-gray-700 placeholder-gray-400"
            />

            {/* NEW: attachments picker + previews */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Attach files (images, PDFs, etc.)
              </label>
              <input
                type="file"
                multiple
                onChange={handleFiles}
                className="block w-full text-sm text-gray-700 file:mr-4 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-gray-200"
              />

              {files.length > 0 && (
                <div className="mt-3 rounded-lg border border-gray-200 p-3">
                  <div className="text-sm text-gray-600 mb-2">
                    {files.length} file(s) selected
                  </div>
                  <ul className="space-y-1 text-sm">
                    {files.map((f) => (
                      <li key={f.name}>
                        {f.name} <span className="text-gray-400">({Math.round(f.size / 1024)} KB)</span>
                      </li>
                    ))}
                  </ul>

                  {imagePreviews.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {imagePreviews.map((p) => (
                        <div key={p.name} className="rounded-md overflow-hidden border">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={p.url} alt={p.name} className="w-full h-32 object-cover" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end mt-4">
              <button
                onClick={handleCreate}
                disabled={!canSubmit || loading}
                className={`rounded-full w-10 h-10 flex items-center justify-center shadow ${
                  canSubmit ? "bg-[#1a73e8] text-white" : "bg-gray-300 text-white cursor-not-allowed"
                }`}
              >
                {loading ? "…" : "+"}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

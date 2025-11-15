"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Avatar from "../../components/Note/Avatar";

// Resolve API base (works with Docker too)
const API_BASE ="http://localhost:8000";

export default function NewBlogPage() {
  const router = useRouter();

  // --- session / token ---
  const { data: session, status } = useSession();
  const authed = status === "authenticated" && !!session?.user?.id;
  const ready = status !== "loading";

  // apiToken อยู่บน session (เหมือนหน้า debug / note)
  const apiToken = authed ? session?.apiToken : null;

  const authHeaders = useMemo(
    () => (apiToken ? { Authorization: `Bearer ${apiToken}` } : {}),
    [apiToken]
  );

  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState([]); // File[]

  // ดึงชื่อจาก session
  const displayName =
    session?.user?.user_name ||
    session?.user?.login_name ||
    session?.user?.name ||
    "anonymous";

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

  // ถ้าโหลดเสร็จแล้วแต่ยังไม่ authed → เด้งไปหน้า login
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

  const handleCreate = async () => {
    if (!canSubmit) return;

    if (!apiToken) {
      alert(
        "Session ของคุณหมดอายุหรือไม่มีสิทธิ์ กรุณา log in ใหม่อีกครั้งก่อนโพสต์บล็อก"
      );
      router.push("/login?callbackUrl=/blog/new");
      return;
    }

    setLoading(true);
    try {
      // สามารถส่ง user_id ไปด้วยก็ได้ แต่ backend ตอนนี้ใช้ req.user.id เป็นหลักแล้ว
      const userId = session?.user?.id || session?.user?.user_id;

      const fd = new FormData();
      fd.append("blog_title", title.trim());
      fd.append("message", detail.trim());
      files.forEach((f) => fd.append("attachments", f));

      const res = await fetch(`${API_BASE}/api/blog`, {
        method: "POST",
        headers: {
          ...authHeaders, // Bearer token
        },
        body: fd, // multer จะจัดการ multipart
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error("create blog failed:", res.status, text);
        alert("Failed to create blog. Please try again.");
        setLoading(false);
        return;
      }

      router.push("/blog");
    } catch (e) {
      console.error("create blog error:", e);
      alert("Failed to create blog. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <section className="relative isolate overflow-hidden py-12 bg-gradient-to-b from-[#DDF3FF] to-[#E8FFF2] min-h-screen">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6">Blog Q&amp;A</h2>

          <div className="mb-4">
            <button
              onClick={() => router.push("/blog")}
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <span className="text-xl">←</span>
              <span>Back</span>
            </button>
          </div>

          <div className="flex items-start gap-6 mb-8">
            <Avatar center={false} size={24} />
            <div className="flex-1 max-w-2xl mx-auto">
              <div className="text-gray-500 mb-2 text-center">
                {displayName}
              </div>
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

            {/* attachments picker + previews */}
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
                        {f.name}{" "}
                        <span className="text-gray-400">
                          ({Math.round(f.size / 1024)} KB)
                        </span>
                      </li>
                    ))}
                  </ul>

                  {imagePreviews.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {imagePreviews.map((p) => (
                        <div
                          key={p.name}
                          className="rounded-md overflow-hidden border"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
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

            <div className="flex justify-end mt-4">
              <button
                onClick={handleCreate}
                disabled={!canSubmit}
                className={`rounded-full w-10 h-10 flex items-center justify-center shadow ${
                  canSubmit
                    ? "bg-[#1a73e8] text-white"
                    : "bg-gray-300 text-white cursor-not-allowed"
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

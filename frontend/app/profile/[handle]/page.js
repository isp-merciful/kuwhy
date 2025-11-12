"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";

import ActiveNoteViewer from "../../components/Note/ActiveNoteViewer";
import BlogCard from "../../components/profile/BlogCard";

export default function ProfilePage() {
  const { data: session } = useSession();
  const params = useParams();
  const handle = String(params?.handle ?? "").toLowerCase();

  const [state, setState] = useState({
    loading: true,
    error: "",
    user: null,
    blogs: [],
  });
  const [hasActiveNote, setHasActiveNote] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        // 1) หา user_id จาก handle
        const uRes = await fetch(
          `http://localhost:8000/api/user/by-handle/${encodeURIComponent(handle)}`,
          { cache: "no-store" }
        );
        if (!uRes.ok) throw new Error("User not found");
        const { user: baseUser } = await uRes.json();

        // 2) โหลดโปรไฟล์เต็ม (ดึง bio/รายละเอียด)
        const fullRes = await fetch(`http://localhost:8000/api/user/${baseUser.user_id}`, {
          cache: "no-store",
        });
        if (!fullRes.ok) throw new Error("Failed to load full profile");
        const fullUser = await fullRes.json();
        const user = { ...baseUser, ...fullUser };

        // 3) ดึง blog ของ user นี้
        let blogs = [];
        try {
          const r = await fetch(`http://localhost:8000/api/blog`, { cache: "no-store" });
          if (r.ok) {
            const all = await r.json();
            blogs = all.filter((b) => {
              const byId = b.user_id && String(b.user_id) === String(user.user_id);
              const byUsersId = b.users?.user_id && String(b.users.user_id) === String(user.user_id);
              const byName = b.user_name && b.user_name === user.user_name;
              const byUsersName = b.users?.user_name && b.users.user_name === user.user_name;
              return byId || byUsersId || byName || byUsersName;
            });
          }
        } catch {}

        // 4) เช็กว่ามีโน้ตล่าสุดไหม
        const noteRes = await fetch(
          `http://localhost:8000/api/note/user/${encodeURIComponent(user.user_id)}`,
          { cache: "no-store" }
        );
        let hasNote = false;
        if (noteRes.ok) {
          const data = await noteRes.json();
          hasNote = data && data.note !== null;
        }

        if (!alive) return;
        setState({ loading: false, error: "", user, blogs });
        setHasActiveNote(hasNote);
      } catch (e) {
        if (!alive) return;
        setState({ loading: false, error: e?.message || "Load failed", user: null, blogs: [] });
        setHasActiveNote(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [handle]);

  if (state.loading) return <PageSkeleton />;
  if (state.error || !state.user) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <h1 className="text-xl font-semibold">User not found</h1>
        <p className="text-gray-500">{state.error || `The handle @${handle} doesn’t exist.`}</p>
      </div>
    );
  }

  const u = state.user;
  const isOwner = !!(session?.user?.id && String(session.user.id) === String(u.user_id));

  const bioText =
    [u?.user_bio, u?.bio, u?.description, u?.about].find((v) => !!v && String(v).trim()) || "";
  const website = normalizeUrl(u?.website);

  return (
    <div className="mx-auto max-w-5xl pb-16 relative">
      {/* cover เขียว-ฟ้าอ่อน */}
      <div className="relative -mt-2 md:-mt-4 -mx-4 md:-mx-6">
        <div className="h-44 md:h-56 w-full rounded-b-2xl overflow-hidden bg-gradient-to-br from-emerald-50 via-cyan-50 to-sky-50" />
      </div>

      {/* Header */}
      <div className="px-4 md:px-6 -mt-12 relative">
        <div className="relative inline-block">
          <div className="p-[3px] rounded-full bg-gradient-to-tr from-emerald-300 to-sky-300 inline-block shadow-sm">
            <img
              src={u.img || "/avatar-placeholder.png"}
              alt={u.user_name || u.login_name}
              className="h-28 w-28 md:h-32 md:w-32 rounded-full object-cover ring-4 ring-white bg-white"
            />
          </div>

          {/* ActiveNoteViewer: แสดงเฉพาะเมื่อมีโน้ต */}
{hasActiveNote && (
  // ยึดจุดยืนเดิม: เริ่มที่กึ่งกลาง แล้วยืดไปทางขวา
  <div className="absolute top-0 left-1/2 -translate-y-[120%]">
    {/* กล่องห่อ: กดไม่ได้ + ขยายตามเนื้อหา + จำกัดความกว้างบน/ล่าง */}
    <div
      className="
        pointer-events-none inline-block align-top
        w-auto min-w-[16rem] max-w-[clamp(22rem,62vw,56rem)]
        [&_*]:break-words [&_*]:whitespace-pre-wrap [&_*]:leading-relaxed [&_*]:text-left
      "
      style={{
        overflowWrap: "anywhere",   // ตัดคำไทย/คำยาว
        wordBreak: "break-word",
        lineBreak: "anywhere",
        textWrap: "pretty",
      }}
    >
      <ActiveNoteViewer
        userId={u.user_id}
        className="inline-block w-auto max-w-full rounded-2xl shadow-lg ring-1 ring-emerald-100/60 bg-white"
      />
    </div>
  </div>
)}
        </div>

        <div className="mt-3 md:mt-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold">
                <span className="bg-gradient-to-r from-emerald-500 to-sky-500 bg-clip-text text-transparent">
                  {u.user_name || u.login_name}
                </span>
              </h1>
              <div className="text-gray-500">@{u.login_name}</div>
            </div>

            {isOwner && (
              <a
                href="/settings"
                className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-gradient-to-r from-emerald-500 to-sky-500 text-white shadow hover:opacity-90"
              >
                Edit Profile
              </a>
            )}
          </div>

          {/* bio จาก backend */}
          {bioText && <p className="mt-3 text-gray-700 whitespace-pre-wrap">{bioText}</p>}
        </div>
      </div>

      {/* Main */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 px-4 md:px-6">
        <aside className="md:col-span-1 space-y-4">
          <Card>
            <div className="font-semibold text-emerald-900">Description</div>
            <p className="mt-2 text-sm text-gray-800 whitespace-pre-wrap">{bioText || "—"}</p>
          </Card>

          <Card>
            <div className="font-semibold text-emerald-900">Details</div>
            <Detail label="Full name" value={u.full_name} />
            <Detail label="Email" value={isOwner ? u.email : undefined} privateHint={!isOwner} />
            <Detail label="Phone" value={isOwner ? u.phone : undefined} privateHint={!isOwner} />
            <Detail label="Location" value={u.location} />
            {website && (
              <div className="text-sm mt-2">
                <span className="text-gray-500">Website </span>
                <a
                  className="underline break-all text-emerald-700 hover:text-emerald-900"
                  target="_blank"
                  rel="noreferrer"
                  href={website}
                >
                  {website}
                </a>
              </div>
            )}
          </Card>
        </aside>

        <main className="md:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-emerald-900">
              Blogs by {u.user_name || `@${u.login_name}`}
            </h2>
            <a
              href="/blog/new"
              className="text-sm rounded-lg px-3 py-1.5 ring-1 ring-emerald-200 text-emerald-700 hover:bg-emerald-50"
            >
              Write a blog
            </a>
          </div>

          {state.blogs?.length ? (
            <div className="space-y-4">
              {state.blogs.map((b) => (
                <BlogCard key={b.blog_id} b={b} />
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center text-gray-500">No blog posts yet.</Card>
          )}
        </main>
      </div>
    </div>
  );
}

/* ---------- helpers / small UI ---------- */
function normalizeUrl(url) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}

function Card({ children, className = "" }) {
  return (
    <div className={`rounded-2xl border border-emerald-100/70 bg-white/80 backdrop-blur-sm p-4 ${className}`}>
      {children}
    </div>
  );
}

function Detail({ label, value, privateHint = false }) {
  return (
    <div className="text-sm flex items-start gap-2 mt-2">
      <span className="text-gray-500 min-w-24">{label}</span>
      <span className="font-medium break-all">{value ? value : privateHint ? "Private" : "—"}</span>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="mx-auto max-w-5xl p-4 animate-pulse">
      <div className="h-44 md:h-56 w-full rounded-b-2xl bg-gradient-to-br from-emerald-50 via-cyan-50 to-sky-50 -mt-2 md:-mt-4 -mx-4 md:-mx-6" />
      <div className="-mt-10 flex items-end gap-4 px-6">
        <div className="h-28 w-28 rounded-full bg-gray-300 ring-4 ring-white" />
        <div className="h-6 w-48 bg-gray-200 rounded" />
      </div>
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 px-4 md:px-6">
        <div className="h-28 bg-gray-200 rounded-2xl" />
        <div className="h-28 bg-gray-200 rounded-2xl md:col-span-2" />
      </div>
    </div>
  );
}
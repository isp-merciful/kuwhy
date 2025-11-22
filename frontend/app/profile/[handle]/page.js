"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import ActiveNoteViewer from "../../components/Note/ActiveNoteViewer";
import BlogCard from "../../components/profile/BlogCard";

const API_BASE =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

function resolveAvatar(url) {
  if (!url) return "/images/pfp.png";
  if (url.startsWith("http")) return url;
  if (url.startsWith("/images/")) return url;
  return `${API_BASE}${url}`;
}

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
    if (!handle) return;
    let alive = true;

    (async () => {
      try {
        const uRes = await fetch(
          `${API_BASE}/api/user/by-handle/${encodeURIComponent(handle)}`,
          { cache: "no-store" }
        );
        if (!uRes.ok) throw new Error("User not found");
        const { user: baseUser } = await uRes.json();

        const fullRes = await fetch(
          `${API_BASE}/api/user/${baseUser.user_id}`,
          { cache: "no-store" }
        );
        if (!fullRes.ok) throw new Error("Failed to load full profile");
        const fullUser = await fullRes.json();
        const user = { ...baseUser, ...fullUser };

        let blogs = [];
        try {
          const r = await fetch(`${API_BASE}/api/blog`, { cache: "no-store" });
          if (r.ok) {
            const all = await r.json();
            blogs = (Array.isArray(all) ? all : []).filter((b) => {
              const byId =
                b.user_id && String(b.user_id) === String(user.user_id);
              const byUsersId =
                b.users?.user_id &&
                String(b.users.user_id) === String(user.user_id);
              const byName = b.user_name && b.user_name === user.user_name;
              const byUsersName =
                b.users?.user_name && b.users.user_name === user.user_name;
              return byId || byUsersId || byName || byUsersName;
            });
          }
        } catch (err) {
          console.warn("load blogs error:", err);
        }

        let hasNote = false;
        try {
          const noteRes = await fetch(
            `${API_BASE}/api/note/user/${encodeURIComponent(user.user_id)}`,
            { cache: "no-store" }
          );
          if (noteRes.ok) {
            const data = await noteRes.json();
            hasNote = data && data.note !== null;
          }
        } catch (err) {
          console.warn("check note error:", err);
        }

        if (!alive) return;
        setState({ loading: false, error: "", user, blogs });
        setHasActiveNote(hasNote);
      } catch (e) {
        if (!alive) return;
        setState({
          loading: false,
          error: e?.message || "Load failed",
          user: null,
          blogs: [],
        });
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
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-cyan-50 to-emerald-100 pt-24 pb-16">
        <div className="mx-auto max-w-3xl p-6">
          <h1 className="text-xl font-semibold">User not found</h1>
          <p className="mt-2 text-gray-600">
            {state.error || `The handle @${handle} doesn’t exist.`}
          </p>
        </div>
      </div>
    );
  }

  const u = state.user;
  const isOwner =
    !!session?.user?.id && String(session.user.id) === String(u.user_id);

  const bioText =
    [u?.user_bio, u?.bio, u?.description, u?.about].find(
      (v) => !!v && String(v).trim()
    ) || "";

  const avatarSrc = resolveAvatar(u.img || u.image);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-cyan-50 to-emerald-100 pt-24 pb-16">
      <div className="mx-auto max-w-5xl px-4 md:px-6">
{/* ===== HERO SECTION (PFP + background + note bubble) ===== */}
<section className="rounded-3xl border border-emerald-100/70 bg-gradient-to-br from-emerald-50 via-cyan-50 to-sky-50 shadow-sm px-6 py-6 sm:px-8 sm:py-8">
  <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
    {/* ซ้าย: bubble อยู่ตรงบน PFP, ชื่ออยู่คอลัมน์ขวา */}
    <div className="w-full sm:w-auto">
      <div className="grid grid-cols-[auto,1fr] gap-x-4 sm:gap-x-6 items-center">
        {hasActiveNote && (
          <div
            className="
              col-start-1 row-start-1 mb-3
              justify-self-center
              pointer-events-none inline-block
              max-w-[min(56rem,100%)]
              [&_*]:break-words [&_*]:whitespace-pre-wrap
            "
            style={{
              overflowWrap: "anywhere",
              wordBreak: "break-word",
              lineBreak: "anywhere",
            }}
          >
            <ActiveNoteViewer userId={u.user_id} />
          </div>
        )}

        {/* PFP */}
        <div className="col-start-1 row-start-2 justify-self-center">
          <div className="p-[3px] rounded-full bg-gradient-to-tr from-emerald-300 to-sky-300 inline-block shadow-sm">
            <img
              src={avatarSrc}
              alt={u.user_name || u.login_name}
              className="h-24 w-24 sm:h-28 sm:w-28 rounded-full object-cover ring-4 ring-white bg-white"
              onError={(e) => {
                if (e.currentTarget.src !== "/images/pfp.png") {
                  e.currentTarget.src = "/images/pfp.png";
                }
              }}
            />
          </div>
        </div>

        {/* ชื่อ + handle */}
        <div className="col-start-2 row-start-2">
          <h1
            className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-emerald-500 to-sky-500 bg-clip-text text-transparent break-words"
            style={{ wordBreak: "break-word", overflowWrap: "anywhere" }}
          >
            {u.user_name || u.login_name}
          </h1>
          <div className="text-gray-500">@{u.login_name}</div>
        </div>
      </div>
    </div>

    {/* ปุ่ม Edit Profile */}
    {isOwner && (
      <a
        href="/settings"
        className="self-start sm:self-center inline-flex items-center px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-sky-500 text-white text-sm font-semibold shadow hover:opacity-90 transition"
      >
        Edit Profile
      </a>
    )}
  </div>
</section>

        {/* ===== MAIN GRID SECTION ===== */}
        <section className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 pb-4">
          {/* LEFT: Description + Details */}
          <aside className="md:col-span-1 space-y-4">
            <Card>
              <div className="font-semibold text-emerald-900">Description</div>
              <p
                className="mt-2 text-sm text-gray-800 whitespace-pre-wrap"
                style={{
                  wordBreak: "break-word",
                  overflowWrap: "anywhere",
                }}
              >
                {bioText || "—"}
              </p>
            </Card>

            <Card>
              <div className="font-semibold text-emerald-900">Details</div>
              <Detail label="Full name" value={u.full_name} />
              <Detail
                label="Phone"
                value={isOwner ? u.phone : undefined}
                privateHint={!isOwner}
              />
              <Detail label="Location" value={u.location} />
            </Card>
          </aside>

          {/* RIGHT: Blogs */}
          <main className="md:col-span-2">
            <Card className="space-y-4 p-5 md:p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-emerald-900 break-words">
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
                    <a
                      key={b.blog_id}
                      href={`/blog/${b.blog_id}`}
                      className="group block rounded-2xl border border-emerald-100 bg-emerald-50/60 hover:bg-emerald-50 hover:border-emerald-200 hover:shadow-md hover:shadow-emerald-900/5 transition-all cursor-pointer overflow-hidden"
                      style={{
                        wordBreak: "break-word",
                        overflowWrap: "anywhere",
                      }}
                    >
                      <BlogCard b={b} />
                    </a>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-sm text-gray-500">
                  No blog posts yet.
                </div>
              )}
            </Card>
          </main>
        </section>
      </div>
    </div>
  );
}

/* ---------- helpers / small UI ---------- */

function Card({ children, className = "" }) {
  return (
    <div
      className={`rounded-2xl border border-emerald-100/70 bg-white/80 p-4 ${className}`}
      style={{ wordBreak: "break-word", overflowWrap: "anywhere" }}
    >
      {children}
    </div>
  );
}

function Detail({ label, value, privateHint = false }) {
  return (
    <div className="text-sm flex items-start gap-2 mt-2">
      <span className="text-gray-500 min-w-24">{label}</span>
      <span className="font-medium break-words">
        {value ? value : privateHint ? "Private" : "—"}
      </span>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-cyan-50 to-emerald-100">
      <div className="mx-auto max-w-5xl p-4 pt-24 animate-pulse">
        <div className="h-40 w-full rounded-3xl bg-gradient-to-br from-emerald-50 via-cyan-50 to-sky-50" />
        <div className="mt-6 flex items-end gap-4">
          <div className="h-20 w-20 rounded-full bg-gray-300 ring-4 ring-white" />
          <div className="h-6 w-48 bg-gray-200 rounded" />
        </div>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-28 bg-gray-200 rounded-2xl" />
          <div className="h-28 bg-gray-200 rounded-2xl md:col-span-2" />
        </div>
      </div>
    </div>
  );
}
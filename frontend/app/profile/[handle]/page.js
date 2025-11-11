"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

// ใช้ path แบบ relative ให้ตรงกับโฟลเดอร์จริงของคุณ
import ActiveNoteViewer from "../../components/Note/ActiveNoteViewer";
import BlogCard from "../../components/profile/BlogCard";

export default function ProfilePage() {
  const routerParams = useParams();                           // ✅ ดึงพารามิเตอร์จาก router
  const handle = String(routerParams?.handle ?? "").toLowerCase();

  const [state, setState] = useState({
    loading: true,
    error: "",
    user: null,
    blogs: [],
  });

  // ... (ที่เหลือต่อจากโค้ดเดิมของคุณได้เลย)



  useEffect(() => {
    let ok = true;

    async function run() {
      try {
        // 1) ดึงโปรไฟล์จาก backend โดย handle
        const profRes = await fetch(
          `http://localhost:8000/api/user/by-handle/${encodeURIComponent(
            handle
          )}`,
          { cache: "no-store" }
        );
        if (!ok) return;
        if (!profRes.ok) throw new Error("User not found");
        const prof = await profRes.json();
        const user = prof.user;

        // 2) ดึงบล็อกทั้งหมด แล้วกรองเฉพาะของ user นี้ (รองรับหลายรูปแบบ)
        let blogs = [];
        try {
          const r = await fetch(`http://localhost:8000/api/blog`, {
            cache: "no-store",
          });
          if (r.ok) {
            const all = await r.json();
            blogs = all.filter((b) => {
              const byId = b.user_id && b.user_id === user.user_id;
              const byName = b.user_name && b.user_name === user.user_name;
              const byUsersId =
                b.users?.user_id && b.users.user_id === user.user_id;
              const byUsersName =
                b.users?.user_name && b.users.user_name === user.user_name;
              return byId || byName || byUsersId || byUsersName;
            });
          }
        } catch {}

        if (!ok) return;
        setState({ loading: false, error: "", user, blogs });
      } catch (e) {
        if (!ok) return;
        setState({
          loading: false,
          error: e.message || "Load failed",
          user: null,
          blogs: [],
        });
      }
    }

    run();
    return () => {
      ok = false;
    };
  }, [handle]);

  if (state.loading) return <PageSkeleton />;
  if (state.error || !state.user) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <h1 className="text-xl font-semibold">User not found</h1>
        <p className="text-gray-500">
          {state.error || `The handle @${handle} doesn’t exist.`}
        </p>
      </div>
    );
  }

  const u = state.user;
  const coverUrl = "/images/profile-cover.jpg"; // เปลี่ยนได้ตามโปรเจกต์

  return (
    <div className="mx-auto max-w-5xl pb-10">
      {/* Cover */}
      <div className="h-48 md:h-56 w-full rounded-b-2xl bg-gradient-to-r from-gray-100 to-gray-200 relative overflow-hidden">
        <img
          src={coverUrl}
          alt="cover"
          className="h-full w-full object-cover opacity-70"
        />
      </div>

      {/* Header */}
      <div className="px-4 md:px-6 -mt-12 relative">
        <div className="relative inline-block">
          <img
            src={u.img || "/avatar-placeholder.png"}
            alt={u.user_name || u.login_name}
            className="h-28 w-28 md:h-32 md:w-32 rounded-full object-cover ring-4 ring-white shadow-md bg-white"
          />
          {/* Active Note bubble ติดที่หัวโปรไฟล์ */}
          <ActiveNoteViewer
            userId={u.user_id}
            className="absolute -bottom-3 left-24 md:left-32"
          />
        </div>

        <div className="mt-3 md:mt-4">
          <div className="text-2xl md:text-3xl font-bold">
            {u.user_name || u.login_name}
          </div>
          <div className="text-gray-500">@{u.login_name}</div>
        </div>

        {/* Tabs */}
        <div className="mt-6 border-b flex gap-6 text-sm">
          <a
            href={`/note?owner=${u.user_id}`}
            className="py-2 -mb-px border-b-2 border-transparent hover:border-gray-300"
          >
            Notes
          </a>
          <a
            href={`/blog?author=${u.user_id}`}
            className="py-2 -mb-px border-b-2 border-transparent hover:border-gray-300"
          >
            Blog
          </a>
          <a
            href={`/party?user=${u.user_id}`}
            className="py-2 -mb-px border-b-2 border-transparent hover:border-gray-300"
          >
            Party
          </a>
        </div>
      </div>

      {/* Main */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 px-4 md:px-6">
        {/* Left column: about */}
        <aside className="md:col-span-1 space-y-4">
          {u.bio && (
            <div className="rounded-2xl border p-4">
              <div className="font-semibold">About</div>
              <p className="mt-2 text-sm text-gray-800 whitespace-pre-wrap">
                {u.bio}
              </p>
            </div>
          )}
          {(u.location || u.website) && (
            <div className="rounded-2xl border p-4 space-y-3">
              <div className="font-semibold">Details</div>
              {u.location && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500">Location</span>
                  <span className="font-medium">{u.location}</span>
                </div>
              )}
              {u.website && (
                <div className="text-sm">
                  <span className="text-gray-500">Website </span>
                  <a
                    className="underline break-all"
                    target="_blank"
                    rel="noreferrer"
                    href={u.website}
                  >
                    {u.website}
                  </a>
                </div>
              )}
            </div>
          )}
        </aside>

        {/* Right column: blogs */}
        <main className="md:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Blogs by {u.user_name || `@${u.login_name}`}
            </h2>
            <a href="/blog/new" className="text-sm underline">
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
            <div className="rounded-2xl border p-8 text-center text-gray-500">
              No blog posts yet.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="mx-auto max-w-5xl p-4 animate-pulse">
      <div className="h-40 w-full rounded-2xl bg-gray-200" />
      <div className="-mt-10 flex items-end gap-4 px-6">
        <div className="h-28 w-28 rounded-full bg-gray-300 ring-4 ring-white" />
        <div className="h-6 w-48 bg-gray-200 rounded" />
      </div>
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="h-24 bg-gray-200 rounded-2xl" />
        <div className="h-24 bg-gray-200 rounded-2xl" />
        <div className="h-24 bg-gray-200 rounded-2xl" />
      </div>
    </div>
  );
}

"use client";

import { useSession } from "next-auth/react";
import Avatar from "../components/Note/Avatar";
import BlogList from "../components/blog/BlogList";

export default function BlogPage() {
  const { data: session } = useSession();

  const displayName =
    session?.user?.user_name ||
    session?.user?.login_name ||
    session?.user?.name ||
    "username";

  // ให้ seed fix (ใช้ user id ถ้ามี ไม่งั้นใช้ค่า default)
  const avatarSeed = session?.user?.id || "blog-header-default";

  return (
    <div className="min-h-screen bg-white">
      <section className="relative isolate overflow-hidden py-8 bg-gradient-to-b from-[#DDF3FF] to-[#E8FFF2]">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-4">Blog Q&amp;A</h2>
          <div className="mb-3">
            <button
              onClick={() => (window.location.href = "/")}
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <span className="text-xl">←</span>
              <span>Back</span>
            </button>
          </div>
          <div className="flex flex-col items-center gap-3">
            <div className="text-gray-500 text-sm">{displayName}</div>
            <div className="flex items-center gap-4">
              <Avatar
                center={false}
                size={64}
                style="thumbs"           
                seed={avatarSeed}        
              />
              <button
                className="bg-[#2FA2FF] text-white rounded-3xl px-6 py-3 shadow"
                onClick={() => (window.location.href = "/blog/new")}
              >
                Type your question here...
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Pull the list closer to the header */}
      <main className="max-w-5xl mx-auto px-4 pt-3 pb-8">
        <BlogList />
      </main>
    </div>
  );
}

"use client";
import Avatar from "../components/Note/Avatar";
import BlogList from "../components/blog/BlogList";

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="relative isolate overflow-hidden py-8 bg-gradient-to-b from-[#DDF3FF] to-[#E8FFF2]">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-4">Blog Q&A</h2>
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
            <div className="text-gray-500 text-sm">username</div>
            <div className="flex items-center gap-4">
              <Avatar />
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
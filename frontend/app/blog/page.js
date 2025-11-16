"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Avatar from "../components/Note/Avatar";
import BlogList from "../components/blog/BlogList";

export default function BlogPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  // --- read current query params ---
  const currentTag = searchParams.get("tag") || "";
  const currentSort = (searchParams.get("sort") || "newest").toLowerCase();

  const [tagInput, setTagInput] = useState(currentTag);
  const [sortMode, setSortMode] = useState(currentSort);

  // keep state in sync with URL
  useEffect(() => {
    setTagInput(currentTag);
  }, [currentTag]);

  useEffect(() => {
    setSortMode(currentSort);
  }, [currentSort]);

  const displayName =
    session?.user?.user_name ||
    session?.user?.login_name ||
    session?.user?.name ||
    "username";

  const avatarSeed = session?.user?.id || "blog-header-default";

  const handleBack = () => {
    router.push("/");
  };

  const handleNewPost = () => {
    router.push("/blog/new");
  };

  // helper: build URL with tag + sort
  const updateUrl = (tagValue, sortValue) => {
    const params = new URLSearchParams();
    const t = tagValue?.trim();
    const s = (sortValue || "newest").toLowerCase();

    if (t) params.set("tag", t);
    if (s && s !== "newest") params.set("sort", s); // omit default

    const qs = params.toString();
    router.push(qs ? `/blog?${qs}` : "/blog");
  };

  const applyTagFilter = (e) => {
    e?.preventDefault?.();
    updateUrl(tagInput, sortMode);
  };

  const clearTagFilter = () => {
    setTagInput("");
    updateUrl("", sortMode);
  };

  const handleSortChange = (e) => {
    const newSort = e.target.value;
    setSortMode(newSort);

    const effectiveTag = tagInput.trim() || currentTag || "";
    updateUrl(effectiveTag, newSort);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-green-50 to-emerald-100">
      {/* Top hero */}
      <section className="relative isolate overflow-hidden py-10 sm:py-12">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl">
          <div className="mx-auto h-72 w-[36rem] bg-gradient-to-r from-emerald-300/40 via-green-300/40 to-lime-300/40 opacity-70" />
        </div>

        <div className="max-w-5xl mx-auto px-4">
          <div className="mb-4 flex items-center justify-between gap-4">
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-900 transition-colors"
            >
              <span className="text-xl leading-none">←</span>
              <span>Back</span>
            </button>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-emerald-900">
              Blog Q&amp;A
            </h2>
            <p className="mt-1 text-sm text-emerald-700/80">
              Ask questions, share stories, and help other KUWHY users.
            </p>
          </div>

          {/* Main header card */}
          <div className="w-full max-w-3xl mx-auto">
            <div className="rounded-3xl border border-emerald-100 bg-white/80 backdrop-blur shadow-sm px-6 py-5 sm:px-8 sm:py-6 flex flex-col sm:flex-row items-center sm:items-stretch gap-4">
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <Avatar
                  center={false}
                  size={64}
                  style="thumbs"
                  seed={avatarSeed}
                />
                <div>
                  <div className="text-xs uppercase tracking-wide text-emerald-500 font-semibold">
                    Signed in as
                  </div>
                  <div className="text-base font-semibold text-emerald-900">
                    {displayName}
                  </div>
                  <p className="text-xs text-emerald-700/80 mt-0.5">
                    What&apos;s on your mind today?
                  </p>
                </div>
              </div>

              <div className="w-full sm:w-auto flex sm:items-center">
                <button
                  className="w-full sm:w-auto inline-flex justify-center items-center rounded-3xl px-6 py-3 text-sm font-semibold shadow-md bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
                  onClick={handleNewPost}
                >
                  Type your question here...
                </button>
              </div>
            </div>
          </div>

          {/* Tag filter + Sort controls */}
          <div className="w-full max-w-3xl mx-auto mt-5">
            <form
              onSubmit={applyTagFilter}
              className="flex flex-col gap-3 sm:flex-row sm:items-end rounded-2xl border border-emerald-100 bg-white/80 px-4 py-3 shadow-sm"
            >
              {/* Tag input */}
              <div className="flex-1">
                <label className="block text-xs font-semibold text-emerald-700/80 mb-1">
                  Filter by tag
                </label>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="e.g. cat, homework, question"
                  className="w-full rounded-xl border border-emerald-100 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 bg-white"
                />
              </div>

              {/* Sort selector */}
              <div className="sm:w-44">
                <label className="block text-xs font-semibold text-emerald-700/80 mb-1">
                  Sort by
                </label>
                <select
                  value={sortMode}
                  onChange={handleSortChange}
                  className="w-full rounded-xl border border-emerald-100 px-3 py-2 text-sm outline-none bg-white focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
                >
                  <option value="newest">Newest</option>
                  <option value="top">Most liked</option>
                </select>
              </div>

              {/* Apply / Clear buttons */}
              <div className="flex gap-2 sm:pt-0 pt-1">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors"
                >
                  Apply
                </button>
                <button
                  type="button"
                  onClick={clearTagFilter}
                  className="inline-flex items-center justify-center rounded-xl border border-emerald-200 px-3 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-50 transition-colors"
                >
                  Clear
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Blog list area */}
      <main className="max-w-5xl mx-auto px-4 pt-3 pb-10">
        <BlogList />
      </main>
    </div>
  );
}

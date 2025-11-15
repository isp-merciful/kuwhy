"use client";

import { useState, useEffect } from "react";
import CreateBlogModal from "./CreateBlogModal";
import BlogList from "./BlogList";

export default function BlogSection() {
  const [open, setOpen] = useState(false);
  const [posts, setPosts] = useState([]);

  // Load posts (optional if BlogList already fetches)
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("http://localhost:8000/api/blog", { cache: "no-store" });
        const data = await res.json();
        setPosts(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Failed to load blogs", e);
      }
    })();
  }, []);

  return (
    <section className="relative z-0">
      <h2 className="text-2xl font-semibold mb-4">Community Blog</h2>

      <div className="my-4">
        <button
          type="button"                                 // ← important if this sits inside a form
          onClick={() => setOpen(true)}                 // ← actually opens the modal
          className="rounded-2xl px-6 py-3 bg-lime-400 hover:bg-lime-500 transition shadow font-medium"
        >
          Create Question
        </button>
      </div>

      {/* Your list (pass posts if you don’t want BlogList re-fetching) */}
      <BlogList initialPosts={posts} />

      {/* Modal lives here so it’s always mounted */}
      <CreateBlogModal
        open={open}
        onClose={() => setOpen(false)}
        onCreated={(newPost) => {
          // optimistic prepend; or refetch
          setPosts((prev) => [newPost, ...prev]);
          setOpen(false);
        }}
      />
    </section>
  );
}

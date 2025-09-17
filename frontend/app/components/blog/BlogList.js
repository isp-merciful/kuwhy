"use client";
import { useEffect, useState } from "react";

export default function BlogList() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/blog`);
        const data = await res.json();
        // ตรวจสอบว่าเป็น array หรือไม่
        setBlogs(Array.isArray(data) ? data : data.data || []);
      } catch (err) {
        console.error("Failed to fetch blogs:", err);
        setBlogs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  if (loading) return <p>Loading blogs...</p>;

  return (
    <div className="mt-6 space-y-4 w-full max-w-xl">
      {blogs.map((b) => (
        <div key={b.blog_id} className="bg-gray-50 p-4 rounded-xl shadow-sm">
          <h3 className="font-bold text-lg">{b.blog_title}</h3>
          <p className="text-gray-700">{b.message}</p>
          <div className="flex items-center gap-4 mt-2">
            <button className="bg-black text-white px-3 py-1 rounded">Reply</button>
            <button>👍🏻 {b.blog_up ?? 0}</button>
            <button>👎🏻 {b.blog_down ?? 0}</button>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            by {b.user_name ?? "Anonymous"} •{" "}
            {new Date(b.created_at).toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
}

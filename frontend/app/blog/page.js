"use client";
import BlogContainer from "../components/blog/BlogContainer";

export default function BlogPage() {
  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#DDF3FF] to-[#E8FFF2] flex flex-col items-center pt-24 overflow-hidden">
      <BlogContainer />
    </div>
  );
}
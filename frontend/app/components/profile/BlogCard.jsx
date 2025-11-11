export default function BlogCard({ b }) {
  return (
    <article className="rounded-2xl border p-4 hover:shadow-sm transition">
      <h3 className="font-semibold text-lg line-clamp-2">
        {b.blog_title || "(untitled)"}
      </h3>
      {b.message && (
        <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">
          {b.message}
        </p>
      )}
    </article>
  );
}

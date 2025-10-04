import Link from "next/link";

export const dynamic = "force-dynamic"; // always fresh

// Deterministic date formatting for SSR + CSR (no locale/calendar mismatch)
function formatDate(iso) {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("en-GB-u-ca-gregory", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: "Asia/Bangkok",
    }).format(new Date(iso));
  } catch {
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} `
         + `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} UTC`;
  }
}

async function fetchPost(id) {
  const res = await fetch(`http://localhost:8000/api/blog/${id}`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json?.data ?? json ?? null;
}

async function fetchAllPosts() {
  const res = await fetch(`http://localhost:8000/api/blog`, {
    cache: "no-store",
  });
  if (!res.ok) return [];
  return res.json();
}

export default async function BlogPostPage({ params }) {
  const { id } = params;

  // Fetch current post and list in parallel
  const [post, allPosts] = await Promise.all([fetchPost(id), fetchAllPosts()]);

  if (!post) {
    return (
      <div className="mx-auto max-w-2xl py-10">
        <h1 className="text-xl font-semibold">Post not found</h1>
        <p className="mt-2 text-gray-600">
          We couldn’t find a blog post with ID <code>{id}</code>.
        </p>
        <Link href="/" className="mt-4 inline-block text-sm text-blue-600 underline">
          ← Back to Community Blog
        </Link>
      </div>
    );
  }

  // Build the "other posts" list (exclude current), recent first, limit to 8
  const otherPosts = (Array.isArray(allPosts) ? allPosts : [])
    .filter((p) => String(p.blog_id) !== String(id))
    .slice(0, 8);

  return (
    <div className="mx-auto max-w-5xl py-10">
      <div className="mb-4">
        <Link href="/" className="text-sm text-gray-600 hover:underline">
          ← Back to Community Blog
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main article */}
        <article className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <header>
            <h1 className="text-2xl font-bold">{post.blog_title}</h1>
            <div className="mt-2 text-sm text-gray-500">
              by {post.user_name ?? "anonymous"} ·{" "}
              <time dateTime={post.created_at} suppressHydrationWarning>
                {post.created_at ? formatDate(post.created_at) : ""}
              </time>
            </div>
          </header>

          <section className="prose mt-4 max-w-none">
            <p className="whitespace-pre-wrap">{post.message}</p>
          </section>

          <footer className="mt-6 flex items-center gap-4 text-sm text-gray-700">
            <div className="flex items-center gap-2">
              <button className="rounded-md border px-3 py-1 hover:bg-gray-50" disabled>
                👍 {post.blog_up ?? 0}
              </button>
              <button className="rounded-md border px-3 py-1 hover:bg-gray-50" disabled>
                👎 {post.blog_down ?? 0}
              </button>
            </div>
          </footer>
        </article>

        {/* Sidebar: Other posts */}
        <aside className="lg:col-span-1">
          <div className="sticky top-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold">Other posts</h2>
            {otherPosts.length === 0 ? (
              <p className="mt-2 text-sm text-gray-600">No other posts yet.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {otherPosts.map((p) => (
                  <li key={p.blog_id} className="group">
                    <Link
                      href={`/blog/${p.blog_id}`}
                      className="block rounded-md border border-transparent p-2 hover:border-gray-200 hover:bg-gray-50"
                    >
                      <div className="line-clamp-1 font-medium group-hover:underline">
                        {p.blog_title || "(untitled)"}
                      </div>
                      <div className="mt-0.5 text-xs text-gray-500">
                        {p.user_name ?? "anonymous"} ·{" "}
                        <time dateTime={p.created_at} suppressHydrationWarning>
                          {p.created_at ? formatDate(p.created_at) : ""}
                        </time>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}


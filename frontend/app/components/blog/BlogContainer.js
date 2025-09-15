import CreateBlogModal from "./CreateBlogModal";
import BlogList from "./BlogList";


export default async function BlogContainer() {
  const res = await fetch("http://localhost:8000/api/blog", {
    cache: "no-store",
  });
  const data = await res.json();

  const blogs = Array.isArray(data) ? data : data.data || [];

  return (
    <div>
      <div className="flex justify-center mb-4">
        <CreateBlogModal />
      </div>
      <BlogList initialBlogs={blogs} />
    </div>
  );
}

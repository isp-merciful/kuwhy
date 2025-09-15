import NoteBubble from "./components/Note/NoteBubble";
import NoteContainer from "./components/Note/NoteContainer";
import BlogContainer from "./components/blog/BlogContainer";

export default function Home() {
  return (
    <div className="p-6 flex flex-col items-center min-h-screen bg-gray-50">
      <NoteBubble />
      <div className="mt-6 w-full max-w-lg">
        <NoteContainer />
      </div>
      <div className="mt-10 w-full max-w-2xl">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Community Blog</h2>
        <BlogContainer />
      </div>
    </div>
  );
}

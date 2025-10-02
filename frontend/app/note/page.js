import { Navbar } from "../components/navbar";
import NotePageSection from "../components/Note/Page";

export default function NotePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <NotePageSection />
    </div>
  );
}



import NoteBubble from './components/Note/NoteBubble';
import NoteContainer from './components/Note/NoteContainer';

export default function Home() {
  return (
    <div className="p-4 flex flex-col items-center">
      <NoteBubble />
      <div className="mt-6 w-full max-w-lg">
        <NoteContainer />
      </div>
    </div>
  );
}

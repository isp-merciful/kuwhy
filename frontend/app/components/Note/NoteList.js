"use client";
import NoteCard from "./NoteCard";
import useUserId from "./useUserId";

export default function NoteList({ notes, onNoteClick }) {
  const userId = useUserId();

  if (!notes || notes.length === 0) {
    return <p className="text-gray-500">No notes available</p>;
  }
  if (!userId) {
    return <p className="text-gray-500">Loading...</p>;
  }

  return (
    <div className="flex overflow-x-auto py-4 gap-4 snap-x snap-mandatory">
      {notes
        .filter((note) => note.user_id !== userId)
        .map((note) => (
          <NoteCard
            key={note.note_id}
            note={note}
            onClick={() => onNoteClick && onNoteClick(note)}
          />
        ))}
    </div>
  );
}

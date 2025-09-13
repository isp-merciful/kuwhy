"use client";
import NoteCard from "./NoteCard";

export default function NoteList({ notes, onNoteClick }) {
  if (!notes || notes.length === 0) {
    return <p className="text-gray-500">No notes available</p>;
  }

  return (
    <div className="flex overflow-x-auto py-4 space-x-4">
      {notes.map((note) => (
        <NoteCard
          key={note.note_id}
          note={note}
          onClick={() => onNoteClick && onNoteClick(note)}
        />
      ))}
    </div>
  );
}

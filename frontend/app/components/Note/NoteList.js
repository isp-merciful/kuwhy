"use client";

import NoteCard from "./NoteCard";

export default function NoteList({ notes, onNoteClick }) {
  if (!notes || notes.length === 0) {
    return null;
  }

  return (
    <div className="flex overflow-x-auto py-3 gap-4 snap-x snap-mandatory">
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

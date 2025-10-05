"use client"; 

import { useEffect, useState } from "react";
import NoteList from "./NoteList";
import Popup from "./Popup";

export default function NoteContainer() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedNote, setSelectedNote] = useState(null);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    async function fetchNotes() {
      try {
        const res = await fetch("http://localhost:8000/api/note", { cache: "no-store" });
        if (!res.ok) throw new Error("โหลดข้อมูลไม่สำเร็จ");
        const data = await res.json();
        setNotes(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchNotes();
  }, []);

  if (loading) return <p></p>;
  if (error) return <p className="text-red-600">error: {error}</p>;

  return (
    <div className="p-4 bg-gray-50 rounded-[30px] shadow-2xl">
      <h2 className="text-l font-bold mb-3">what others say?</h2>

      <NoteList
        notes={notes}
        onNoteClick={(note) => {
          setSelectedNote(note);
          setShowPopup(true);
        }}
      />

      {/* Popup Overlay */}
      {showPopup && selectedNote && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <Popup
            showPopup={showPopup}
            setShowPopup={setShowPopup}
            noteId={selectedNote.note_id}
            text={selectedNote.message}
            name={selectedNote.user_name}
            isPosted={true}
          />
        </div>
      )}
    </div>
  );
}

"use client"; 

import { useEffect, useState } from "react";
import NoteList from "./NoteList";

export default function NoteContainer() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchNotes() {
      try {
        const res = await fetch("/api/note_api", { cache: "no-store" });
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
    <div className="justify-between p-4 bg-gray-50 rounded-xl shadow-md">
      <h2 className="text-lg font-bold mb-3">other</h2>
      <NoteList notes={notes} />
    </div>
  );
}

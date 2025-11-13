"use client";

import { useEffect, useState, useMemo } from "react";
import NoteList from "./NoteList";
import Popup from "./Popup";
import useUserId from "./useUserId";

export default function NoteContainer() {
  const userId = useUserId();

  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedNote, setSelectedNote] = useState(null);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    async function fetchNotes() {
      try {
        const res = await fetch("http://localhost:8000/api/note", {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("โหลดข้อมูลไม่สำเร็จ");

        const data = await res.json();

        // flatten ให้มี user_name / img ตรง ๆ
        const flattened = (data || []).map((n) => ({
          ...n,
          user_name: n.users?.user_name ?? "anonymous",
          img: n.users?.img ?? null,
        }));

        setNotes(flattened);
      } catch (err) {
        setError(err.message || "เกิดข้อผิดพลาด");
      } finally {
        setLoading(false);
      }
    }

    fetchNotes();
  }, []);

  // ซ่อนโน้ตของตัวเองออกจาก community
  const visibleNotes = useMemo(
    () =>
      (notes || []).filter((n) => {
        if (!userId) return true;
        return n.user_id !== userId;
      }),
    [notes, userId]
  );

  const hasAnyNotes = visibleNotes.length > 0;

  const handleCardClick = (note) => {
    setSelectedNote(note);
    setShowPopup(true);
  };

  return (
    <div className="w-full">
      {/* กล่องใหญ่ + gradient border */}
      <div className="rounded-[32px] bg-gradient-to-r from-emerald-50 via-sky-50 to-sky-100 p-[1px] shadow-[0_18px_45px_rgba(15,118,110,0.18)]">
        <div className="rounded-[30px] bg-white/90 backdrop-blur px-5 py-5 sm:px-7 sm:py-6">
          {/* Header รวม notebubble + title เดิม */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-yellow-100 flex items-center justify-center shadow-inner">
                <span className="text-xl">👍</span>
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                  Community Notes
                </h2>
                <p className="text-xs sm:text-sm text-gray-500">
                  Let’s see what’s other say!
                </p>
              </div>
            </div>

            {/* Badge อธิบายว่า party note ถูก highlight */}
            <div className="flex items-center gap-2 text-[11px] sm:text-xs">
              <span className="inline-flex items-center gap-1 rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-sky-700">
                <span className="text-sm">🎉</span>
                <span className="font-medium">Party notes</span>
                <span className="hidden sm:inline text-sky-500/80">
                  highlighted with badge
                </span>
              </span>
            </div>
          </div>

          {/* เนื้อหา */}
          {loading ? (
            // skeleton เบา ๆ ไม่ให้โล่ง
            <div className="mt-2 flex gap-4 overflow-hidden">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-[220px] h-[210px] rounded-3xl bg-slate-50 animate-pulse"
                />
              ))}
            </div>
          ) : error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : hasAnyNotes ? (
            <NoteList notes={visibleNotes} onNoteClick={handleCardClick} />
          ) : (
            <p className="text-sm text-gray-500 mt-2">
              Looks like no notes yet. Why not add yours?✨
            </p>
          )}
        </div>
      </div>

      {/* Popup comment / party detail */}
      {showPopup && selectedNote && (
        <div className="fixed inset-0 bg-black/30  flex items-center justify-center z-50">
          <Popup
            showPopup={showPopup}
            setShowPopup={setShowPopup}
            noteId={selectedNote.note_id}
            text={selectedNote.message}
            name={selectedNote.user_name}
            isPosted={true}
            maxParty={selectedNote.max_party || 0}
            currParty={selectedNote.crr_party || 0}
            ownerId={selectedNote.user_id}
            viewerUserId={userId}
          />
        </div>
      )}

        {/* {showPopup && selectedNote && (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 shadow-xl">
        <p className="font-semibold mb-2">Debug popup</p>
        <p className="text-sm text-gray-600">{selectedNote.message}</p>
      </div>
    </div>
)} */}

    </div>
  );
}

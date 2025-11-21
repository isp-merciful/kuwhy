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

  const [filter, setFilter] = useState("all");

  useEffect(() => {
    async function fetchNotes() {
      try {
        const res = await fetch("http://localhost:8000/api/note", {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("โหลดข้อมูลไม่สำเร็จ");

        const data = await res.json();

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

  const visibleNotes = useMemo(() => {
    let base = (notes || []).filter((n) => {
      if (!userId) return true;
      return n.user_id !== userId;
    });

    if (filter === "party") {
      base = base.filter((n) => (n.max_party ?? 0) > 0);
    } else if (filter === "normal") {
      base = base.filter((n) => (n.max_party ?? 0) <= 0);
    }
    return base;
  }, [notes, userId, filter]);

  const hasAnyNotes = visibleNotes.length > 0;

  const handleCardClick = (note) => {
    setSelectedNote(note);
    setShowPopup(true);
  };

  const handleAfterJoin = ({ noteId, crr_party, max_party }) => {
    const targetId = Number(noteId);
    if (!targetId) return;

    setNotes((prev) =>
      (prev || []).map((n) =>
        Number(n.note_id) === targetId
          ? {
              ...n,
              crr_party:
                typeof crr_party === "number" ? crr_party : n.crr_party,
              max_party:
                typeof max_party === "number" ? max_party : n.max_party,
            }
          : n
      )
    );

    setSelectedNote((prev) => {
      if (!prev || Number(prev.note_id) !== targetId) return prev;
      return {
        ...prev,
        crr_party:
          typeof crr_party === "number" ? crr_party : prev.crr_party,
        max_party:
          typeof max_party === "number" ? max_party : prev.max_party,
      };
    });
  };

  return (
    <div className="w-full">
      <div className="rounded-[32px] bg-gradient-to-r from-emerald-50 via-sky-50 to-sky-100 p-[1px] shadow-[0_18px_45px_rgba(15,118,110,0.18)]">
        <div className="rounded-[30px] bg-white/90 backdrop-blur px-5 py-5 sm:px-7 sm:py-6">
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

            <div className="flex items-center gap-2 text-[11px] sm:text-xs">
              <span className="hidden sm:inline text-gray-400">
                Filter:
              </span>
              <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-1 py-1">
                <button
                  type="button"
                  onClick={() => setFilter("all")}
                  className={`px-2.5 py-1 rounded-full font-medium transition text-[11px] sm:text-xs ${
                    filter === "all"
                      ? "bg-sky-600 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setFilter("normal")}
                  className={`px-2.5 py-1 rounded-full font-medium transition text-[11px] sm:text-xs ${
                    filter === "normal"
                      ? "bg-sky-600 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <span className="text-sm">📝</span>
                  <span className="hidden sm:inline">Normal</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFilter("party")}
                  className={`px-2.5 py-1 rounded-full font-medium transition text-[11px] sm:text-xs flex items-center gap-1 ${
                    filter === "party"
                      ? "bg-sky-600 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <span className="text-sm">🎉</span>
                  <span className="hidden sm:inline">Party</span>
                </button>
              </div>
            </div>
          </div>

          {loading ? (
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
              Looks like no notes in this filter. ✨
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
            onAfterJoin={handleAfterJoin}
          />
        </div>
      )}
    </div>
  );
}

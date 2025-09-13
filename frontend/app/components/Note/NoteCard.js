"use client";

export default function NoteCard({ note, onClick }) {
  return (
    <div
      onClick={onClick}
      className="flex flex-col items-center mx-2 min-w-[150px] cursor-pointer"
    >
      <div className="bg-white rounded-2xl px-4 py-3 shadow-md w-full max-w-xs flex flex-col transition-all duration-200 hover:shadow-lg">
        <p className="text-gray-800 font-semibold text-sm break-words line-clamp-2 h-[40px]">
          {note.message}
        </p>
      </div>

      {note.img && (
        <img
          src={note.img}
          alt={note.note_id}
          className="w-20 h-20 object-cover my-2 rounded-md"
        />
      )}

      <span className="text-gray-900 text-xs font-semibold">{note.user_name}</span>
    </div>
  );
}

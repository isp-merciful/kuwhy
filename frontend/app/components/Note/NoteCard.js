"use client";

export default function NoteCard({ note, onClick }) {
  return (
    <div
      onClick={onClick}
      className="flex flex-col items-center mx-4 min-w-[230px] cursor-pointer"
    >
      <span className="mb-1 text-gray-500 text-sm">{note.user_name}</span>
      <div className="bg-[#EFEFEF] rounded-3xl px-5 py-4 shadow w-full max-w-sm flex flex-col transition-all duration-200">
        <p className="text-gray-900 text-base break-words">
          {note.message}
        </p>
      </div>
      <span className="relative">
        <span className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-x-5 w-3 h-3 rounded-full bg-[#EFEFEF]" />
        <span className="absolute -top-4 left-1/2 -translate-x-1/2 -translate-x-3 w-2 h-2 rounded-full bg-[#EFEFEF]" />
      </span>

      {note.img && (
        <img
          src={note.img}
          alt={note.note_id}
          className="w-24 h-24 object-cover my-3 rounded-full"
        />
      )}
      {!note.img && <div className="h-6" />}
    </div>
  );
}

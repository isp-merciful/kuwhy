"use client";

export default function NoteCard({ note, onClick }) {
  return (
    <div
      onClick={onClick}
      className="flex flex-col items-center mx-2 min-w-[200px] max-w-[250px] cursor-pointer relative"
    >
      {/* Bubble / Message */}
      <div className="bg-white rounded-3xl px-5 py-4 shadow-lg w-full flex flex-col transition-all duration-200 hover:shadow-xl relative">
        <p className="text-gray-800 font-semibold text-base break-words line-clamp-3 h-[60px]">
          {note.message}
        </p>

        {/* Bubble tail: start left-bottom, point to right-bottom */}
        <span
          className="absolute -bottom-2 left-5 w-6 h-6 bg-white shadow-sm"
          style={{
            clipPath: "polygon(0% 0%, 100% 50%, 0% 100%)",
            transform: "rotate(190deg)",
          }}
        />
      </div>

      {/* Optional Image */}
      {note.img && (
        <img
          src={note.img}
          alt={note.note_id}
          className="w-32 h-32 object-cover my-3 rounded-lg"
        />
      )}

      {/* Username */}
      <span className="text-gray-900 text-sm font-semibold mt-1">
        {note.user_name}
      </span>
    </div>
  );
}

"use client";

export default function NoteCard({ note, onClick }) {
  const isParty = (note?.max_party || 0) > 0;
  const curr = Number(note?.crr_party || 0);
  const max = Number(note?.max_party || 0);

  return (
    <div
      onClick={onClick}
      className="snap-start w-[220px] shrink-0 cursor-pointer select-none"
    >
      {/* Bubble: แคบลงและเตี้ยลง */}
      <div className="relative bg-white rounded-3xl p-4 shadow-lg w-full h-[110px] flex flex-col justify-between transition-all duration-200 hover:shadow-xl">
        {/* ข้อความ: จำกัด 2 บรรทัด */}
        <p className="text-gray-800 font-semibold text-sm break-words line-clamp-2 h-[40px]">
          {note.message}
        </p>

        {/* Party pill */}
        <div className={`mt-2 ${isParty ? "" : "invisible"}`}>
          <span className="inline-flex items-center gap-2 text-[11px] bg-white/90 border border-gray-200 rounded-full px-2.5 py-1 shadow-sm">
            <span>🎉 Party</span>
            <span className="font-semibold">{curr}</span>
            <span className="text-gray-500">/</span>
            <span className="font-semibold">{max}</span>
          </span>
        </div>

        {/* หางคำพูด */}
        <span
          className="absolute -bottom-2 left-4 w-5 h-5 bg-white shadow-sm"
          style={{
            clipPath: "polygon(0% 0%, 100% 50%, 0% 100%)",
            transform: "rotate(190deg)",
          }}
        />
      </div>

      {/* รูป: ใหญ่ขึ้น */}
      <div className="h-[128px] my-3 flex items-center justify-center">
        {note.img ? (
          <img
            src={note.img}
            alt={String(note.note_id)}
            className="w-28 h-28 object-cover rounded-xl"
          />
        ) : (
          <div className="w-28 h-28 rounded-xl bg-gray-100 flex items-center justify-center">
            {/* ไอคอน fallback ตามเดิมได้ */}
            <svg viewBox="0 0 24 24" className="w-12 h-12 text-gray-400">
              <circle cx="12" cy="8" r="4" fill="currentColor" />
              <path d="M4 20a8 8 0 0116 0" fill="currentColor" />
            </svg>
          </div>
        )}
      </div>

      {/* ชื่อผู้ใช้: 1 บรรทัด + … */}
      <span className="block text-center text-gray-900 text-sm font-semibold mt-1 truncate">
        {note.user_name}
      </span>
    </div>
  );
}

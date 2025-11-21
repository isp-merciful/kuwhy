"use client";

export default function NoteCard({ note, onClick }) {
  const isParty = (note?.max_party || 0) > 0;
  const curr = Number(note?.crr_party || 0);
  const max = Number(note?.max_party || 0);
  const isFull = isParty && max > 0 && curr >= max;

  const partyPillColor = isFull
    ? "bg-rose-50 text-rose-700 border-rose-100"
    : "bg-[#E7F6EF] text-[#2F7757] border-[#52B788]/40";

  const tailBgClass = isParty ? "bg-amber-50" : "bg-white";
  const tailBorderClass = isParty ? "border-amber-100" : "border-slate-100";

  return (
    <div
      onClick={onClick}
      className="snap-start w-[230px] shrink-0 cursor-pointer select-none transition-transform duration-150 hover:-translate-y-1"
    >
      <div
        className={`relative rounded-3xl p-4 h-[120px] flex flex-col justify-between shadow-sm hover:shadow-md border ${
          isParty
            ? "bg-gradient-to-br from-yellow-50 to-amber-50 border-amber-100"
            : "bg-white border-slate-100"
        }`}
      >
        <p className="text-gray-900 font-semibold text-sm break-words line-clamp-2">
          {note.message}
        </p>

        <div className="mt-2 flex items-center justify-between">
          {isParty ? (
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border ${partyPillColor}`}
            >
              <span className="text-xs">🎉</span>
              <span>Party</span>
              {max > 0 && (
                <>
                  <span className="mx-1 text-xs text-gray-400">•</span>
                  <span>
                    {curr}/{max}
                  </span>
                </>
              )}
              {isFull && (
                <span className="ml-1 text-[10px] uppercase tracking-wide text-rose-500">
                  FULL
                </span>
              )}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border border-slate-100 bg-slate-50 text-slate-500">
              <span>📝</span>
              <span>Normal note</span>
            </span>
          )}

          <span className="text-[11px] font-medium text-sky-500">
            View
          </span>
        </div>

        <span
          aria-hidden
          className={`pointer-events-none absolute -bottom-2 left-1/2 -translate-x-1/2 -translate-x-7 w-3 h-3 rounded-full shadow-sm ${tailBgClass} ${tailBorderClass}`}
        />
        <span
          aria-hidden
          className={`pointer-events-none absolute left-1/2 -translate-x-1/2 -translate-x-5 w-2 h-2 rounded-full ${tailBgClass} ${tailBorderClass}`}
          style={{ bottom: "-1.125rem" }}
        />
      </div>

      <div className="my-3 flex flex-col items-center justify-center gap-2 min-h-[110px]">
        {note.img ? (
          <img
            src={note.img}
            alt={String(note.user_name || note.note_id)}
            className="w-24 h-24 object-cover rounded-full border-4 border-sky-100 shadow-sm"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-sky-50 flex items-center justify-center border-4 border-sky-100 shadow-sm">
            <span className="text-3xl">🙂</span>
          </div>
        )}

        <span className="block text-center text-gray-900 text-sm font-semibold truncate w-full">
          {note.user_name}
        </span>
      </div>
    </div>
  );
}
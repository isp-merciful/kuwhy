{/* ===== TOP BUBBLE ===== */}
<div className="px-6 pt-6 pb-0">
  <div className="flex justify-center">
    {isParty ? (
      <div className="relative text-center">
        <div
          className="
            inline-block w-full max-w-[260px]    /* ขนาดใกล้ ๆ bubble ตอนพิมพ์ */
            rounded-3xl bg-neutral-900 text-white
            px-5 py-3 shadow-md
          "
          style={{ textWrap: "pretty" }}
        >
          <div className="flex items-center justify-center gap-2 text-[13px] font-semibold text-fuchsia-300">
            <SparklesIcon className="h-4 w-4" />
            <span>{crazyLabel}</span>
          </div>
          <p
            className="
              mt-1 text-sm md:text-[15px] font-semibold leading-snug
              text-left whitespace-pre-wrap break-words
            "
            style={{ textWrap: "pretty" }}
          >
            {text || "—"}
          </p>
        </div>

        {/* หาง bubble (เหมือนเดิม ห้ามเปลี่ยน) */}
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-2 left-1/2 -translate-x-1/2 -translate-x-5 w-3 h-3 rounded-full bg-neutral-900"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute left-1/2 -translate-x-1/2 -translate-x-3 w-2 h-2 rounded-full bg-neutral-900"
          style={{ bottom: "-1.125rem" }}
        />
      </div>
    ) : (
      <div className="relative text-center">
        <div
          className="
            inline-block w-full max-w-[260px]
            rounded-3xl bg-green-100 text-gray-800
            px-5 py-3 shadow-sm
          "
          style={{ textWrap: "pretty" }}
        >
          <p
            className="
              text-sm md:text-[15px] font-semibold leading-snug
              text-left whitespace-pre-wrap break-words
            "
            style={{ textWrap: "pretty" }}
          >
            {text || "—"}
          </p>
        </div>

        {/* tail bubble (เหมือนเดิม) */}
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-2 left-1/2 -translate-x-1/2 -translate-x-5 w-3 h-3 rounded-full bg-green-100"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute left-1/2 -translate-x-1/2 -translate-x-3 w-2 h-2 rounded-full bg-green-100"
          style={{ bottom: "-1.125rem" }}
        />
      </div>
    )}
  </div>
</div>

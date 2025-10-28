"use client";
import { useEffect, useRef, useState } from "react";

/** ฟองแชท (ตัดคำ/ขึ้นบรรทัด + จำกัดความกว้าง) */
function Bubble({ mine, name, img, text, time }) {
  return (
    <div className={`flex items-end gap-2 ${mine ? "justify-end" : "justify-start"}`}>
      {/* รูปเฉพาะฝั่งคนอื่น */}
      {!mine && (
        <img
          src={img || "/images/person2.png"}
          alt={name || "anonymous"}
          className="w-8 h-8 rounded-full object-cover shrink-0"
        />
      )}

      <div
        className={`flex flex-col ${
          mine ? "items-end text-right" : "items-start text-left"
        }`}
        /* กัน container กว้างเกิน */
        style={{ maxWidth: "100%" }}
      >
        {/* ชื่อเฉพาะฝั่งคนอื่น */}
        {!mine && <div className="text-xs text-gray-500 mb-1">{name || "anonymous"}</div>}

        <div
          className={[
            // จำกัดกว้าง “ครึ่งนึงนิด ๆ” ของ viewport แชท
            "max-w-[55%]",
            // ตัดคำทุกกรณี + เคารพ \n
            "break-words break-all whitespace-pre-wrap",
            // ฟอง
            "px-4 py-2 rounded-2xl leading-relaxed",
            mine ? "bg-blue-500 text-white rounded-br-sm" : "bg-gray-100 text-gray-900 rounded-bl-sm",
          ].join(" ")}
        >
          {text}
        </div>

        <div className={`text-[10px] mt-1 ${mine ? "text-white/80" : "text-gray-400"}`}>
          {time ? new Date(time).toLocaleTimeString() : ""}
        </div>
      </div>
    </div>
  );
}

/** หน้าต่างแชทปาร์ตี้ */
export default function PartyChat({ noteId, userId }) {
  const [messages, setMessages] = useState([]);
  const [pending, setPending] = useState(false);
  const [text, setText] = useState("");

  const bottomRef = useRef(null);
  const cursorRef = useRef(0); // message_id ล่าสุด

  // โหลดครั้งแรก + โพลทุก 3 วิ
  useEffect(() => {
    if (!noteId) return;

    let alive = true;
    async function fetchMore() {
      try {
        const res = await fetch(
          `http://localhost:8000/api/chat/party/${noteId}?cursor=${cursorRef.current}&limit=50`,
          { cache: "no-store" }
        );
        if (!alive || !res.ok) return;
        const data = await res.json();
        const incoming = Array.isArray(data.messages) ? data.messages : [];
        if (incoming.length === 0) return;

        setMessages((prev) => {
          const merged = [...prev, ...incoming];
          const last = merged[merged.length - 1];
          if (last) cursorRef.current = last.message_id;
          return merged;
        });
      } catch {}
    }

    setMessages([]);
    cursorRef.current = 0;
    fetchMore();
    const iv = setInterval(fetchMore, 3000);
    return () => {
      alive = false;
      clearInterval(iv);
    };
  }, [noteId]);

  // เลื่อนลงล่างอัตโนมัติ
  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send() {
    const content = String(text || "").trim();
    if (!content) return;
    setPending(true);
    try {
      const res = await fetch(`http://localhost:8000/api/chat/party/${noteId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, content }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data?.error || "Send failed");
      } else if (data?.value) {
        setMessages((prev) => [...prev, data.value]);
        cursorRef.current = data.value.message_id;
      }
    } catch {
      alert("ไม่สามารถเชื่อมต่อ server ได้");
    } finally {
      setPending(false);
      setText("");
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* viewport */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {messages.length === 0 && (
          <div className="text-sm text-gray-400 text-center mt-6">ยังไม่มีข้อความ</div>
        )}
        {messages.map((m) => (
          <Bubble
            key={m.message_id}
            mine={m.user_id === userId}
            name={m.user_name}
            img={m.img}
            text={m.content}
            time={m.created_at}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* composer */}
      <div className="mt-2 pt-2 border-t flex gap-2 sticky bottom-0 bg-white z-10">
        <textarea
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Aa"
          className="flex-1 border rounded-2xl px-4 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 whitespace-pre-wrap"
        />
        <button
          onClick={send}
          disabled={pending || !text.trim()}
          className={`px-4 py-2 rounded-full text-white transition ${
            text.trim() && !pending ? "bg-blue-500 hover:bg-blue-600" : "bg-gray-300"
          }`}
        >
          ส่ง
        </button>
      </div>
    </div>
  );
}

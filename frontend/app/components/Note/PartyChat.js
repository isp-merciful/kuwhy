"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useSession } from "next-auth/react";

/** ฟองแชท (ตัดคำ/ขึ้นบรรทัด + จำกัดความกว้าง) */
function Bubble({ mine, name, img, text, time }) {
  return (
    <div className={`flex items-end gap-2 ${mine ? "justify-end" : "justify-start"}`}>
      {!mine && (
        <img
          src={img || "/images/person2.png"}
          alt={name || "anonymous"}
          className="w-8 h-8 rounded-full object-cover shrink-0"
        />
      )}
      <div className={`flex flex-col ${mine ? "items-end text-right" : "items-start text-left"}`} style={{ maxWidth: "100%" }}>
        {!mine && <div className="text-xs text-gray-500 mb-1">{name || "anonymous"}</div>}
        <div
          className={[
            "max-w-[60%]",
            "inline-flex items-center justify-center",
            "text-center whitespace-pre-wrap break-words hyphens-auto",
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
  const { data: session, status } = useSession();
  const ready = status === "authenticated" && !!session?.apiToken;

  const [messages, setMessages] = useState([]);
  const [pending, setPending] = useState(false);
  const [text, setText] = useState("");
  const [netErr, setNetErr] = useState("");

  const bottomRef = useRef(null);
  const cursorRef = useRef(0); // message_id ล่าสุด

  // helper: fetch ที่ใส่ Bearer ให้อัตโนมัติ
  const authFetch = useCallback(
    (url, options = {}) =>
      fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {}),
          ...(session?.apiToken ? { Authorization: `Bearer ${session.apiToken}` } : {}),
        },
        cache: "no-store",
      }),
    [session?.apiToken]
  );

  // โหลดครั้งแรก + โพลทุก 3 วิ (เฉพาะตอนพร้อมใช้งานเท่านั้น)
  useEffect(() => {
    if (!noteId) return;

    let alive = true;
    let iv;

    async function fetchMore() {
      if (!alive || !ready) return; // ยังไม่พร้อม (ยังไม่ล็อกอิน) ก็ไม่โพล
      try {
        const res = await authFetch(
          `http://localhost:8000/api/chat/party/${noteId}?cursor=${cursorRef.current}&limit=50`
        );
        if (!alive) return;
        if (!res.ok) {
          // 401/403 ก็หยุดเงียบ ๆ ไม่ spam alert
          return;
        }
        const data = await res.json();
        const incoming = Array.isArray(data.messages) ? data.messages : [];
        if (incoming.length === 0) return;

        setMessages((prev) => {
          const merged = [...prev, ...incoming];
          const last = merged[merged.length - 1];
          if (last) cursorRef.current = last.message_id;
          return merged;
        });
      } catch {
        // เงียบ แต่เก็บสถานะไว้แสดงแบบบางเบา
        if (alive) setNetErr("Network problem");
      }
    }

    // reset state เมื่อเปลี่ยนห้อง
    setMessages([]);
    cursorRef.current = 0;
    setNetErr("");

    // เรียกครั้งแรก (ถ้าพร้อม)
    fetchMore();
    // โพลทุก 3 วินาที
    iv = setInterval(fetchMore, 3000);

    return () => {
      alive = false;
      clearInterval(iv);
    };
  }, [noteId, ready, authFetch]);

  // เลื่อนลงล่างอัตโนมัติ
  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send() {
    const content = String(text || "").trim();
    if (!content || !ready) return;
    setPending(true);
    setNetErr("");
    try {
      // ✅ ไม่ส่ง user_id — backend อ่านจาก req.user.id ที่ได้จาก token
      const res = await authFetch(`http://localhost:8000/api/chat/party/${noteId}`, {
        method: "POST",
        body: JSON.stringify({ content }),
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
        {!ready && (
          <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mt-3 text-center">
            Please sign in to view and send messages.
          </div>
        )}
        {ready && messages.length === 0 && (
          <div className="text-sm text-gray-400 text-center mt-6">No messages yet, feel free to start!</div>
        )}
        {ready &&
          messages.map((m) => (
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
        <input
          type="text"
          value={text}
          onChange={(e) => {
            const noNewline = e.target.value.replace(/[\r\n]+/g, " ");
            setText(noNewline);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              send();
            }
          }}
          onPaste={(e) => {
            e.preventDefault();
            const pasted = (e.clipboardData || window.clipboardData).getData("text");
            const oneLine = pasted.replace(/[\r\n]+/g, " ");
            setText((prev) => (prev + " " + oneLine).trim());
          }}
          placeholder={ready ? "Aa" : "Sign in to chat"}
          disabled={!ready}
          className="flex-1 border rounded-2xl px-4 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
        />
        <button
          onClick={send}
          disabled={pending || !text.trim() || !ready}
          className={`px-4 py-2 rounded-full text-white transition ${
            text.trim() && !pending && ready ? "bg-blue-500 hover:bg-blue-600" : "bg-gray-300"
          }`}
        >
          send
        </button>
      </div>
      {netErr && <div className="text-xs text-gray-400 mt-1 text-center">{netErr}</div>}
    </div>
  );
}

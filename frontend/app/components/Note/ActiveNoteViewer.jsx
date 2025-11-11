"use client";
import { useEffect, useRef, useState } from "react";
import MessageInput from "./MessageInput";

/**
 * แสดงโน้ตปัจจุบันของผู้ใช้:
 * - ถ้ามีโน้ต => แสดง MessageInput แบบ isPosted=true (อ่านอย่างเดียว)
 * - ถ้าไม่มี => ไม่ render อะไรเลย
 */
export default function ActiveNoteViewer({
  userId,
  authHeaders = {},   // เผื่อกรณีต้องแนบโทเคน
  className = "",
}) {
  const mountedRef = useRef(false);

  const [loading, setLoading] = useState(true);
  const [hasNote, setHasNote] = useState(false);

  // state เพื่อ feed ให้ MessageInput
  const [text, setText] = useState("");
  const [isPosted, setIsPosted] = useState(false);
  const [noteId, setNoteId] = useState(null);

  // เพิ่ม state อื่น ๆ ตามภาพ (ใช้ดู state อย่างเดียว)
  const [isParty, setIsParty] = useState(false);
  const [maxParty, setMaxParty] = useState(0);
  const [currParty, setCurrParty] = useState(0);
  const [joinedMemberOnly, setJoinedMemberOnly] = useState(false);

  useEffect(() => {
    mountedRef.current = true;
    const controller = new AbortController();

    async function fetchNote() {
      try {
        const res = await fetch(
          `http://localhost:8000/api/note/user/${encodeURIComponent(userId)}`,
          {
            signal: controller.signal,
            cache: "no-store",
            headers: { ...authHeaders },
          }
        );
        if (!mountedRef.current) return;

        if (!res.ok) {
          // ไม่มีโน้ตหรือ error -> reset ให้ไม่แสดง
          setHasNote(false);
          setIsPosted(false);
          setNoteId(null);
          setText("");
          setIsParty(false);
          setMaxParty(0);
          setCurrParty(0);
          setJoinedMemberOnly(false);
          setLoading(false);
          return;
        }

        const data = await res.json();

        // API ของคุณ: ไม่มีโน้ต => { note: null }
        if (data?.note === null || !data?.message) {
          setHasNote(false);
          setIsPosted(false);
          setNoteId(null);
          setText("");
          setIsParty(false);
          setMaxParty(0);
          setCurrParty(0);
          setJoinedMemberOnly(false);
          setLoading(false);
          return;
        }

        // มีโน้ต -> โชว์เป็นบับเบิลอ่านอย่างเดียว
        setHasNote(true);
        setIsPosted(true);             // <- ทำให้แก้ไขไม่ได้ (MessageInput จะ render <p>)
        setNoteId(data.note_id ?? null);
        setText(data.message ?? "");

        const mp = Number(data.max_party || 0);
        setIsParty(mp > 0);
        setMaxParty(mp);
        setCurrParty(Number(data.crr_party || 0));
        setJoinedMemberOnly(!!data.joined_member_only);
        setLoading(false);
      } catch (_e) {
        if (!mountedRef.current) return;
        // error network -> ปิดการแสดง
        setHasNote(false);
        setIsPosted(false);
        setNoteId(null);
        setText("");
        setIsParty(false);
        setMaxParty(0);
        setCurrParty(0);
        setJoinedMemberOnly(false);
        setLoading(false);
      }
    }

    if (userId) fetchNote();

    return () => {
      mountedRef.current = false;
      controller.abort();
    };
  }, [userId, authHeaders]);

  if (loading) return null;          // ไม่โชว์ skeleton ตามโจทย์ “ไม่มีเวลาบอก”
  if (!hasNote) return null;         // ไม่มีโน้ต => ไม่แสดงอะไรเลย

  return (
    <div className={className}>
      <MessageInput
        text={text}
        setText={setText}
        isPosted={isPosted}           // true => อ่านอย่างเดียว
        handlePost={() => {}}
        loading={false}
        showButton={false}            // ไม่ให้มีปุ่มโพสต์
        variant="default"
        onBubbleClick={undefined}     // ไม่เปิดแก้ไข
      />
      {/* คุณต้องการดู state เพิ่มเติม/ดีบั๊ก สามารถเปิดบรรทัดล่างได้ */}
      {/* <pre className="text-xs text-gray-500 mt-2">
        {JSON.stringify({ noteId, isParty, maxParty, currParty, joinedMemberOnly }, null, 2)}
      </pre> */}
    </div>
  );
}

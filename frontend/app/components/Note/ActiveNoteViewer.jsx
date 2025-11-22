"use client";
import { useEffect, useRef, useState } from "react";
import MessageInput from "./MessageInput";

export default function ActiveNoteViewer({
  userId,
  authHeaders = {},  
  className = "",
}) {
  const mountedRef = useRef(false);

  const [loading, setLoading] = useState(true);
  const [hasNote, setHasNote] = useState(false);

  const [text, setText] = useState("");
  const [isPosted, setIsPosted] = useState(false);
  const [noteId, setNoteId] = useState(null);

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

        setHasNote(true);
        setIsPosted(true);            
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

  if (loading) return null;         
  if (!hasNote) return null;         

  return (
    <div className={className}>
      <MessageInput
        text={text}
        setText={setText}
        isPosted={isPosted}           
        handlePost={() => {}}
        loading={false}
        showButton={false}            
        variant="default"
        onBubbleClick={undefined}    
      />
    </div>
  );
}

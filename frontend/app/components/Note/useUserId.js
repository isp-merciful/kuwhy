"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

const ACTIVE_KEY = "userId";        
const ANON_KEY   = "anon_user_id";  

export default function useUserId() {
  const { data: session, status } = useSession(); 
  const [id, setId] = useState(null);

  useEffect(() => {
    if (status === "loading") return; 

    const setActive = (next) => {
      try {
        const cur = localStorage.getItem(ACTIVE_KEY);
        if (cur !== next) localStorage.setItem(ACTIVE_KEY, next);
      } catch {}
      setId(next); 
    };

    if (status === "authenticated" && session?.user?.id) {
      setActive(String(session.user.id));
      return;
    }

    try {
      let anon = localStorage.getItem(ANON_KEY);
      if (!anon) {
        anon = crypto.randomUUID();
        localStorage.setItem(ANON_KEY, anon);
      }
      setActive(anon);
    } catch {
      const fallback = crypto.randomUUID();
      setActive(fallback);
    }
  }, [status, session?.user?.id]);

  return id;
}

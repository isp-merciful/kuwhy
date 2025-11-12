// frontend/app/components/useUserId.js
"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

const ACTIVE_KEY = "userId";        // ใช้ทุกที่ในแอป
const ANON_KEY   = "anon_user_id";  // เก็บ anon แยก

export default function useUserId() {
  const { data: session, status } = useSession(); // 'loading' | 'authenticated' | 'unauthenticated'
  const [id, setId] = useState(null);

  useEffect(() => {
    if (status === "loading") return; // ยังโหลด session อยู่ → อย่าแตะอะไร

    const setActive = (next) => {
      try {
        const cur = localStorage.getItem(ACTIVE_KEY);
        if (cur !== next) localStorage.setItem(ACTIVE_KEY, next);
      } catch {}
      setId(next); // ← ใช้ตัวนี้ให้ตรงกับ useState
    };

    if (status === "authenticated" && session?.user?.id) {
      // ล็อกอิน → ใช้ id จริง
      setActive(String(session.user.id));
      return;
    }

    // ไม่ได้ล็อกอิน → ใช้ anon id (สร้างครั้งแรก)
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

// frontend/app/components/useUserId.js (หรือไฟล์เดิมของคุณ)
"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export default function useUserId() {
  const { data: session, status } = useSession(); // 'loading' | 'authenticated' | 'unauthenticated'
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    // รอจนรู้สถานะ session ก่อน
    if (status === "loading") return;

    // 1) ถ้ามี session → ใช้ session.user.id (จริง) เสมอ
    if (status === "authenticated" && session?.user?.id) {
      const id = session.user.id;
      setUserId(id);
      // sync localStorage ให้เท่ากับ user ที่ล็อกอิน
      try {
        localStorage.setItem("userId", id);
      } catch {}
      return;
    }

    // 2) ถ้า "ยังไม่ได้ล็อกอิน" → ใช้ anonymous id (คงเดิมถ้ามี)
    try {
      let anon = localStorage.getItem("userId");
      if (!anon) {
        anon = crypto.randomUUID();
        localStorage.setItem("userId", anon);
      }
      setUserId(anon);
    } catch {
      // fallback ถ้า localStorage พัง
      setUserId(crypto.randomUUID());
    }
  }, [status, session?.user?.id]);

  return userId;
}

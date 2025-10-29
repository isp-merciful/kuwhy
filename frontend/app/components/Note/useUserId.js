'use client';
import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';

export default function useUserId() {
  const { data: session, status } = useSession();
  const [userId, setUserId] = useState(null);
  const mergedRef = useRef({ lastUserId: null, lastAnonId: null }); // กันยิง merge ซ้ำ

  useEffect(() => {
    // รอจน session โหลดเสร็จ (หลีกเลี่ยงวิ่งตอน 'loading')
    if (status === 'loading') return;

    const genAnon = () => {
      try {
        const id = crypto.randomUUID();
        localStorage.setItem('userId', id);
        return id;
      } catch {
        // fallback
        const id = `anon-${Date.now()}-${Math.random().toString(16).slice(2)}`;
        localStorage.setItem('userId', id);
        return id;
      }
    };

    let currentId = localStorage.getItem('userId');
    if (currentId) currentId = currentId.replace(/"/g, '').trim();

    // ✅ เคสล็อกอิน (ทั้ง Google และ Credentials)
    if (status === 'authenticated' && session?.user?.id) {
      const loginId = String(session.user.id);

      // เดาว่า provider ไหน: ถ้าอีเมลลงท้าย @local.invalid = credentials
      const isCredentials = !!session.user.email?.endsWith?.('@local.invalid');
      const provider = isCredentials ? 'credentials' : 'google';

      // ถ้ามี anon id เดิม และไม่ตรงกับ user.id → ยิง merge หนึ่งครั้ง
      if (
        currentId &&
        currentId !== loginId &&
        !(
          mergedRef.current.lastUserId === loginId &&
          mergedRef.current.lastAnonId === currentId
        )
      ) {
        mergedRef.current = { lastUserId: loginId, lastAnonId: currentId };

        // ยิง merge ไป backend ของคุณ
        fetch('http://localhost:8000/api/user/merge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: loginId,
            anonymous_id: currentId,
            user_name: session.user.name ?? null,
            email: session.user.email ?? null,
            image: session.user.image ?? null,
            role: 'member',
            provider, // 'google' | 'credentials'
          }),
        }).catch(() => {
          // เงียบไว้ (ไม่บล็อค UI) — อยาก log ก็เพิ่มได้
        });
      }

      // อัปเดต localStorage ให้เป็นไอดีถาวรของผู้ใช้ (session.user.id)
      localStorage.setItem('userId', loginId);
      setUserId(loginId);
      return;
    }

    // ❇️ เคส anonymous (ยังไม่ล็อกอิน)
    if (!currentId) {
      currentId = genAnon();
    }
    setUserId(currentId);
  }, [status, session?.user?.id, session?.user?.email, session?.user?.name, session?.user?.image]);

  return userId;
}



// 'use client';
// import { useState, useEffect } from "react";
// import { useSession } from "next-auth/react";

// export default function useUserId() {
//   const { data: session } = useSession();
//   const [userId, setUserId] = useState(null);

//   useEffect(() => {
//     const generateAnonymousId = () => {
//     let newId = crypto.randomUUID();
//     localStorage.setItem("userId", newId);
//     return newId;
//     };
    
//     let currentId = localStorage.getItem("userId");
//     if (currentId) currentId = currentId.replace(/"/g, "").trim();

//     if (session?.user?.id) {
//       // case: user login
//       const loginId = session.user.id;

      
//       // merge anonymous -> user (ไม่เปลี่ยน primary key)
//       if (currentId && currentId !== loginId) {
//         fetch("http://localhost:8000/api/user/merge", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({
//             user_id: loginId,
//             anonymous_id: currentId,
//             user_name: session.user.name,
//             email: session.user.email,
//             image: session.user.image,
//             role: "member",
//           }),
//         });
//       }

//       // update localStorage ให้เป็น userId ของ session
//       localStorage.setItem("userId", loginId);
//       currentId = loginId;
//     } else {
//       // case: anonymous
//       if (!currentId) {
//         currentId = generateAnonymousId();
//       }
//     }

//     setUserId(currentId);
//   }, [session]);

//   return userId; 
// }

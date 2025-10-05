'use client';
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export default function useUserId() {
  const { data: session } = useSession();
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const generateAnonymousId = () => {
      const newId = crypto.randomUUID();
      localStorage.setItem("userId", newId);
      return newId;
    };

    let currentId = localStorage.getItem("userId");

    if (session?.user?.id) {
      // case: user login
      const loginId = session.user.id;

      // merge anonymous -> user (ไม่เปลี่ยน primary key)
      if (currentId && currentId !== loginId) {
        fetch("http://localhost:8000/api/user/merge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: loginId,
            anonymous_id: currentId,
            user_name: session.user.name,
            email: session.user.email,
            image: session.user.image,
            role: "member",
          }),
        });
      }

      // update localStorage ให้เป็น userId ของ session
      localStorage.setItem("userId", loginId);
      currentId = loginId;
    } else {
      // case: anonymous
      if (!currentId) {
        currentId = generateAnonymousId();
      }
    }

    setUserId(currentId);
  }, [session]);

  return userId; 
}

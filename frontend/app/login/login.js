"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const STORAGE_KEY = "kuwhy_user";
const API_BASE = "http://localhost:8000/api";

export function getStoredUser() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_err) {
    return null;
  }
}

export function setStoredUser(user) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function logout() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export async function loginOrRegister(userId, userName) {
  const res = await fetch(`${API_BASE}/user`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, user_name: userName })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to login/register");
  }

  const data = await res.json();
  const user = data.user || {
    user_id: data.user_id || userId,
    user_name: data.user_name || userName || "anonymous",
    img: data.img || "/images/pfp.png"
  };

  setStoredUser(user);
  return user;
}

export function useRequireAuth(redirectTo = "/login") {
  const router = useRouter();

  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      router.replace(redirectTo);
    }
  }, [router, redirectTo]);

  return getStoredUser();
}



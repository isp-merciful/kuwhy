"use client";
import { useState, useEffect } from "react";

/**
 * Hook สำหรับใช้ localStorage แบบ state (ปลอดภัยกับ SSR/Hydration)
 * @param {string} key - คีย์ที่จะเก็บใน localStorage
 * @param {*} initialValue - ค่าเริ่มต้น
 */
export default function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(initialValue);

  // โหลดค่าจาก localStorage หลัง client mount เท่านั้น
  useEffect(() => {
    if (typeof window === "undefined") return; // ป้องกัน SSR
    try {
      const saved = localStorage.getItem(key);
      if (saved !== null && saved !== "undefined") {
        setValue(JSON.parse(saved));
      }
    } catch (error) {
      console.error("Error loading from localStorage:", error);
    }
  }, [key]);

  // บันทึกค่าใหม่เข้า localStorage ทุกครั้งที่เปลี่ยน
  useEffect(() => {
    if (typeof window === "undefined") return; // ป้องกัน SSR
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }
  }, [key, value]);

  return [value, setValue];
}

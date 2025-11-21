"use client";
import { useState, useEffect } from "react";

/**
 * 
 * @param {string} key 
 * @param {*} initialValue 
 */
export default function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(initialValue);


  useEffect(() => {
    if (typeof window === "undefined") return; 
    try {
      const saved = localStorage.getItem(key);
      if (saved !== null && saved !== "undefined") {
        setValue(JSON.parse(saved));
      }
    } catch (error) {
      console.error("Error loading from localStorage:", error);
    }
  }, [key]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }
  }, [key, value]);

  return [value, setValue];
}

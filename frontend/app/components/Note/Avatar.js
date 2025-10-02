"use client";
import { useEffect, useState } from "react";

const personIcons = ["/images/avatar1.png", "/images/avatar2.png", "/images/avatar3.png"];

export default function Avatar({ center = true, size = 20 }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % personIcons.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const sizeClass = `w-${size} h-${size}`;
  return (
    <div className={center ? "mt-1 flex justify-center w-full" : "mt-1"}>
      <img
        src={personIcons[currentIndex]}
        alt="person"
        className={`${sizeClass} rounded-full object-cover border border-gray-300`}
      />
    </div>
  );
}

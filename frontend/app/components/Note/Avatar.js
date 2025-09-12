"use client";
import { useEffect, useState } from "react";

const personIcons = ["/images/person1.png", "/images/person2.png", "/images/person3.png"];

export default function Avatar() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % personIcons.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mt-1 flex justify-center w-full">
      <img
        src={personIcons[currentIndex]}
        alt="person"
        className="w-20 h-20 rounded-full object-cover border border-gray-300"
      />
    </div>
  );
}

"use client";
import { useState } from "react";

export default function UserNameEditor({ name, setName, isPosted }) {
  const [tempName, setTempName] = useState(name);
  const [isEditing, setIsEditing] = useState(false);

const confirmChange = async () => {
  if (tempName.trim() === "" || tempName === name) {
    setIsEditing(false);
    return;
  }

  try {
    const userId = localStorage.getItem("userId"); // ใช้ UUID ของผู้ใช้
    const res = await fetch(`http://localhost:8000/api/user/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: tempName }),
    });

    if (!res.ok) throw new Error("Failed to update name");

    const data = await res.json();
    setName(data.user_name); // อัปเดตชื่อใน state
  } catch (err) {
    console.error("Error updating user name:", err);
  } finally {
    setIsEditing(false);
  }
};


  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      confirmChange();
    }
    if (e.key === "Escape") {
      setTempName(name);
      setIsEditing(false);
    }
  };

  return (
    <div className="mt-2 flex justify-center">
      {isEditing && !isPosted ? (
        <input
          type="text"
          maxLength={15}
          className="text-sm text-gray-700 dark:text-gray-300 bg-transparent 
                    border-0 border-b border-gray-400 
                    focus:border-b-2 focus:border-blue-500 focus:outline-none 
                    transition"
          value={tempName}
          onChange={(e) => setTempName(e.target.value)}
          onBlur={confirmChange}
          onKeyDown={handleKeyDown}
          autoFocus
        />
      ) : (
        <span
          className={`${
            isPosted ? "cursor-default text-gray-500" : "cursor-pointer hover:text-blue-500"
          } text-gray-600 dark:text-gray-400 transition`}
          onClick={() => {
            if (!isPosted) {
              setTempName(name);
              setIsEditing(true);
            }
          }}
        >
          {name}
        </span>
      )}
    </div>
  );
}

"use client";
import { useState, useEffect } from "react";
import { PencilIcon } from "@heroicons/react/24/outline";

export default function UserNameEditor({
  name,
  setName,
  isPosted,
  editNameOnExpand,
  setEditNameOnExpand,
  onEditClick
}) {
  const [tempName, setTempName] = useState(name);
  const [isEditing, setIsEditing] = useState(false);
  const [hover, setHover] = useState(false);

  useEffect(() => {
    setTempName(name);
  }, [name]);

  // ตรวจสอบ flag จาก NoteBubble
  useEffect(() => {
    if (editNameOnExpand && !isPosted) {
      setIsEditing(true);
      setEditNameOnExpand(false); // รีเซ็ต flag หลังเปิด edit
    }
  }, [editNameOnExpand, isPosted, setEditNameOnExpand]);

  const confirmChange = async () => {
    if (tempName.trim() === "" || tempName === name) {
      setIsEditing(false);
      return;
    }

    try {
      const userId = localStorage.getItem("userId");
      const res = await fetch(`http://localhost:8000/api/user/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: tempName }),
      });
      if (!res.ok) throw new Error("Failed to update name");
      const data = await res.json();
      setName(data.user_name);
    } catch (err) {
      console.error("Error updating user name:", err);
    } finally {
      setIsEditing(false);
    }
  };

  const handleClick = () => {
    if (!isPosted) {
      if (onEditClick) onEditClick(); // กดตรง username
      setIsEditing(true);             // เปิด edit ชื่อทันที
    }
  };

  return (
    <div
      className="mt-2 flex justify-center items-center relative"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {isEditing && !isPosted ? (
        <input
          type="text"
          maxLength={15}
          className="text-sm text-gray-700 bg-transparent border-0 border-b border-gray-400 focus:border-b-2 focus:border-blue-500 focus:outline-none transition"
          value={tempName}
          onChange={(e) => setTempName(e.target.value)}
          onBlur={confirmChange}
          onKeyDown={(e) => {
            if (e.key === "Enter") confirmChange();
            if (e.key === "Escape") setIsEditing(false);
          }}
          autoFocus
        />
      ) : (
        <span
          className={`${
            isPosted ? "cursor-default text-gray-500" : "cursor-pointer text-gray-600 hover:text-blue-500"
          } flex items-center space-x-1 transition`}
          onClick={handleClick}
        >
          <span>{name}</span>
          {!isPosted && hover && <PencilIcon className="w-4 h-4 text-gray-400" />}
        </span>
      )}
    </div>
  );
}


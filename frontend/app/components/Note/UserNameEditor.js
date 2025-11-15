"use client";
import { useState, useEffect } from "react";
import { PencilIcon } from "@heroicons/react/24/outline";

export default function UserNameEditor({
  name,
  setName,
  isPosted,
  editNameOnExpand,
  setEditNameOnExpand,
  onEditClick,
}) {
  const [tempName, setTempName] = useState(name || "");
  const [isEditing, setIsEditing] = useState(false);
  const [hover, setHover] = useState(false);

  // sync tempName กับ name จาก parent
  useEffect(() => {
    // ระหว่างกำลังแก้ไขอยู่ ไม่ให้ค่าใหม่จาก parent มาทับที่พิมพ์อยู่
    if (!isEditing) {
      setTempName(name || "");
    }
  }, [name, isEditing]);

  // ตรวจสอบ flag จาก NoteBubble (ตอน expand แล้วให้เข้าโหมด edit ชื่อ)
  useEffect(() => {
    if (editNameOnExpand && !isPosted) {
      setIsEditing(true);
      setEditNameOnExpand(false); // รีเซ็ต flag หลังเปิด edit
    }
  }, [editNameOnExpand, isPosted, setEditNameOnExpand]);

  const confirmChange = async () => {
    const trimmed = (tempName || "").trim();

    // ถ้าชื่อว่าง → ยกเลิกแล้วกลับไปใช้ค่าเดิม
    if (!trimmed) {
      setTempName(name || "");
      setIsEditing(false);
      return;
    }

    // ถ้าเหมือนเดิม → ปิดช่องเฉย ๆ
    if (trimmed === (name || "")) {
      setIsEditing(false);
      return;
    }

    // ✅ อัปเดตชื่อใน state ของ NoteBubble ทันที (optimistic)
    // ทำให้ UserNameEditor ทั้ง 2 จุดเห็นชื่อใหม่โดยไม่ต้องรีเฟรช
    setName(trimmed);
    setIsEditing(false);

    // 🔁 แล้วค่อยยิง API แบบเดิมของคุณตามหลัง
    try {
      const userId = localStorage.getItem("userId");
      const dicebearUrl = `https://api.dicebear.com/9.x/thumbs/svg?seed=${userId}`;

      const res = await fetch(`http://localhost:8000/api/user/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        // ✅ ใช้ payload แบบเดิม { name: ... } เพื่อรักษาพฤติกรรมเก่า
        body: JSON.stringify({ name: trimmed ,img: dicebearUrl}),
      });
      if (!res.ok) throw new Error("Failed to update name");

      const data = await res.json().catch(() => null);

      // ถ้า backend ส่ง user_name กลับมา ก็ sync ทับอีกที (กันเคส backend ปรับชื่อให้)
      if (data && data.user_name) {
        setName(data.user_name);
        setTempName(data.user_name);
      }
    } catch (err) {
      console.error("Error updating user name:", err);
      // ถ้า error ก็ไม่ revert ชื่อบน UI เพื่อไม่ให้ดูหายไป
    }
  };

  const handleClick = () => {
    if (!isPosted) {
      if (onEditClick) onEditClick(); // แจ้ง NoteBubble ว่ากำลัง edit (setIsComposing อะไรพวกนี้)
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
          className="text-sm text-gray-1000 bg-transparent border-0 border-b border-gray-400 focus:border-b-2 focus:border-blue-500 focus:outline-none transition"
          value={tempName}
          onChange={(e) => setTempName(e.target.value)}
          onBlur={confirmChange}
          onKeyDown={(e) => {
            if (e.key === "Enter") confirmChange();
            if (e.key === "Escape") {
              // กด Esc → ยกเลิกและกลับไปใช้ชื่อเดิม
              setTempName(name || "");
              setIsEditing(false);
            }
          }}
          autoFocus
        />
      ) : (
        <span
          className={`${
            isPosted
              ? "cursor-default text-gray-800"
              : "cursor-pointer text-gray-600 hover:text-blue-500"
          } flex items-center space-x-1 transition`}
          onClick={handleClick}
        >
          <span>{name || "Set a display name"}</span>
          {!isPosted && hover && (
            <PencilIcon className="w-4 h-4 text-gray-400" />
          )}
        </span>
      )}
    </div>
  );
}

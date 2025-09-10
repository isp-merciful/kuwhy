"use client";

export default function Popup({ showPopup, setShowPopup }) {
  if (!showPopup) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-10 z-50">
      <div className="bg-white rounded-xl p-6 w-80 shadow-lg">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">การตอบกลับ</h2>
        <p className="text-sm text-gray-600 mb-4">test popup</p>
        <button
          onClick={() => setShowPopup(false)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
        >
          ปิด
        </button>
      </div>
    </div>
  );
}

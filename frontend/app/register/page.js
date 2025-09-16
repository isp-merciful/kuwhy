"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE = "http://localhost:8000/api";

export default function RegisterPage() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!userId.trim()) {
      setError("Please enter your user ID");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId.trim(), user_name: userName.trim() })
      });
      if (!res.ok) throw new Error("Register failed");
      setSuccess("Registered successfully. You can now sign in.");
      setTimeout(() => router.replace("/login"), 800);
    } catch (err) {
      setError(err.message || "Register failed");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
      >
        <h1 className="text-2xl font-semibold mb-4 text-center">Register</h1>

        <label className="block text-sm font-medium mb-1">User ID</label>
        <input
          className="w-full mb-3 rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-black"
          placeholder="Enter your student ID"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
        />

        <label className="block text-sm font-medium mb-1">Display Name</label>
        <input
          className="w-full mb-4 rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-black"
          placeholder="Your name"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
        />

        {error && <div className="mb-3 text-sm text-red-600">{error}</div>}
        {success && <div className="mb-3 text-sm text-green-600">{success}</div>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-black text-white py-2 disabled:opacity-60"
        >
          {loading ? "Registering..." : "Create account"}
        </button>
      </form>
    </div>
  );
}



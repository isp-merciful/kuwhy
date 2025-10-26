'use client';

import { useSession, signIn, signOut } from "next-auth/react";
import { useState, useEffect } from "react";

export default function LoginPage() {
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);

  // สำหรับ login ด้วย credential
  const [login_name, setLoginName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const handleCredentialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:8000/api/user/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login_name, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      // เก็บข้อมูล user ไว้ใน localStorage
      localStorage.setItem("user", JSON.stringify(data));
      alert("Login successful!");

      // redirect ไปหน้าอื่น เช่น dashboard
      window.location.href = "/dashboard";
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 px-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-10 w-full max-w-sm text-center">
        <img
          src="/images/logo.png"
          alt="KUWHY Logo"
          className="w-24 h-24 mx-auto mb-6"
        />

        {!session ? (
          <>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome to KUWHY
            </h1>
            <p className="text-gray-500 dark:text-gray-300 mb-6">
              Sign in with Google or use your KUWHY credentials
            </p>

            {/* ปุ่ม Google Sign-In */}
            <button
              onClick={() => signIn("google")}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border border-black text-black font-semibold rounded-lg shadow-md hover:bg-gray-100 transition mb-4"
            >
              <img
                src="/images/google-icon.svg"
                alt="Google"
                className="w-6 h-6"
              />
              Sign in with Google
            </button>

            {/* ช่องกรอก credential login */}
            <form onSubmit={handleCredentialLogin} className="space-y-3 text-left">
              <input
                type="text"
                placeholder="Username"
                value={login_name}
                onChange={(e) => setLoginName(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
              />
              {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition disabled:opacity-60"
              >
                {loading ? "Logging in..." : "Login with Credentials"}
              </button>
            </form>
          </>
        ) : (
          <>
            <img
              src={session.user?.image || "/images/logo.png"}
              alt={session.user?.name || "User"}
              className="w-24 h-24 mx-auto rounded-full mb-4 border-4 border-indigo-500"
            />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Hello, {session.user?.name}!
            </h1>
            <p className="text-gray-500 dark:text-gray-300 mb-6">
              {session.user?.email}
            </p>
            <button
              onClick={() => signOut({ redirect: false })}
              className="w-full py-3 px-4 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold rounded-lg transition"
            >
              Sign out
            </button>
          </>
        )}
      </div>
    </div>
  );
}

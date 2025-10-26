"use client";

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

  // สำหรับ register
  const [register_name, setRegisterName] = useState("");
  const [register_password, setRegisterPassword] = useState("");
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // ✅ Credential Login Handler
  const handleCredentialLogin = async (e) => {
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

      if (typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(data));
        alert("Login successful!");
        window.location.href = "/dashboard";
      }
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Register Handler
  const handleRegister = async (e) => {
    e.preventDefault();
    setRegisterLoading(true);
    setRegisterError("");

    try {
      const res = await fetch("http://localhost:8000/api/user/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
              "user_id" : "u1-8855-99de",
              "user_name" : "naaBBtBs%%dfs",
              "email":"kasdfymail.coaadm",
              "password" : "bankwongclas",
              "login_name" : "kuytok"
          }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      alert("Registration successful! You can now log in.");
      setRegisterName("");
      setRegisterPassword("");
    } catch (err) {
      setRegisterError(err.message || "An error occurred");
    } finally {
      setRegisterLoading(false);
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
              Sign in with your KUWHY credentials or Google account
            </p>

            {/* ✅ Credential Login (Moved to the top) */}
            <form onSubmit={handleCredentialLogin} className="space-y-3 text-left mb-6">
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
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>

            {/* ✅ OAuth Login (Google) */}
            <button
              onClick={() => signIn("google")}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border border-black text-black font-semibold rounded-lg shadow-md hover:bg-gray-100 transition mb-6"
            >
              <img
                src="/images/google-icon.svg"
                alt="Google"
                className="w-6 h-6"
              />
              Sign in with Google
            </button>

            {/* ✅ Register Section */}
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mt-8 mb-3">
              Don’t have an account? Register below
            </h2>
            <form onSubmit={handleRegister} className="space-y-3 text-left">
              <input
                type="text"
                placeholder="New Username"
                value={register_name}
                onChange={(e) => setRegisterName(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
              />
              <input
                type="password"
                placeholder="New Password"
                value={register_password}
                onChange={(e) => setRegisterPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
              />
              {registerError && (
                <p className="text-red-500 text-sm text-center">{registerError}</p>
              )}
              <button
                type="submit"
                disabled={registerLoading}
                className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition disabled:opacity-60"
              >
                {registerLoading ? "Registering..." : "Register"}
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

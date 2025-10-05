'use client';

import { useSession, signIn, signOut } from "next-auth/react";
import { useState, useEffect } from "react";

export default function LoginPage() {
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true); // รอจน client render
  }, []);

  if (!mounted) return null; // ไม่ render อะไรตอน SSR

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
              Sign in with your Google account to continue
            </p>
            <button
              onClick={() => signIn("google")}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border border-black text-black font-semibold rounded-lg shadow-md hover:bg-gray-100 transition"
            >
              <img
                src="/images/google-icon.svg"
                alt="Google"
                className="w-6 h-6"
              />
              Sign in with Google
            </button>
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

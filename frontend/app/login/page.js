'use client';

import { useSession, signIn, signOut } from "next-auth/react";

export default function LoginPage() {
  const { data: session } = useSession();

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-sm w-full bg-white shadow-lg rounded-xl p-8 text-center">
          <img
            src="/images/logo.png"
            alt="KUWHY Logo"
            className="w-20 h-20 mx-auto mb-6"
          />
          <h1 className="text-2xl font-bold mb-4 text-gray-900">Welcome to KUWHY</h1>
          <p className="text-gray-500 mb-6">Sign in to continue and join the community!</p>
          <button
            onClick={() => signIn("google")}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg shadow-md transition"
          >
            <img
              src="/images/google-icon.svg"
              alt="Google"
              className="w-6 h-6"
            />
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white shadow-lg rounded-xl p-8 text-center">
        <img
          src={session.user.image}
          alt={session.user.name}
          className="w-24 h-24 mx-auto rounded-full mb-4 border-4 border-indigo-500"
        />
        <h1 className="text-2xl font-bold mb-2 text-gray-900">Hello, {session.user.name}!</h1>
        <p className="text-gray-500 mb-6">{session.user.email}</p>
        <button
          onClick={() => signOut({ redirect: false })}
          className="w-full py-3 px-4 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold rounded-lg shadow-md transition"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

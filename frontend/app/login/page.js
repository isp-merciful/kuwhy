'use client';

import { useSession, signIn, signOut } from "next-auth/react";
import { useState, useEffect } from "react";

export default function LoginPage() {
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setMounted(true); // รอจน client render
  }, []);

  const handleSignIn = async () => {
    setIsLoading(true);
    await signIn("google");
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    await signOut({ redirect: false });
    setIsLoading(false);
  };

  if (!mounted) return null; // ไม่ render อะไรตอน SSR

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-green-50 to-blue-100">
        {/* Floating geometric shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.02'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
        <div className="w-full max-w-md">
          {/* Glassmorphism Card */}
          <div className="backdrop-blur-xl bg-white/80 dark:bg-gray-800/80 rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/20 p-8 text-center transform transition-all duration-500 hover:scale-[1.02] hover:shadow-3xl">
            
            {/* Logo with enhanced styling */}
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-green-600 rounded-full blur-lg opacity-20 scale-110"></div>
              <img
                src="/images/logo.png"
                alt="KUWHY Logo"
                className="relative w-20 h-20 mx-auto drop-shadow-lg"
              />
            </div>

            {!session ? (
              <>
                {/* Welcome Section */}
                <div className="space-y-4 mb-8">
                  <h1 className="text-3xl font-light text-gray-900 dark:text-white">
                    Welcome to
                  </h1>
                  <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-green-600 to-teal-600 bg-clip-text text-transparent">
                    KU WHY
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-lg font-light leading-relaxed">
                    Connect, ask, and share with your KU community
                  </p>
                </div>

                {/* Sign In Button */}
                <button
                  onClick={handleSignIn}
                  disabled={isLoading}
                  className="group w-full flex items-center justify-center gap-4 py-4 px-6 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white font-medium rounded-2xl shadow-lg hover:shadow-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isLoading ? (
                    <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <img
                        src="/images/google-icon.svg"
                        alt="Google"
                        className="w-6 h-6 transition-transform group-hover:scale-110"
                      />
                      <span>Continue with Google</span>
                    </>
                  )}
                </button>

                {/* Additional Info */}
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-6 leading-relaxed">
                  By signing in, you agree to our terms of service and privacy policy
                </p>
              </>
            ) : (
              <>
                {/* User Profile Section */}
                <div className="space-y-6">
                  {/* Profile Picture with enhanced styling */}
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-green-500 rounded-full blur-lg opacity-30 scale-110"></div>
                    <img
                      src={session.user?.image || "/images/logo.png"}
                      alt={session.user?.name || "User"}
                      className="relative w-24 h-24 mx-auto rounded-full border-4 border-white dark:border-gray-800 shadow-xl"
                    />
                    <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                  </div>

                  {/* User Info */}
                  <div className="space-y-2">
                    <h1 className="text-2xl font-light text-gray-900 dark:text-white">
                      Welcome back,
                    </h1>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                      {session.user?.name}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 font-light">
                      {session.user?.email}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <button
                      onClick={() => window.location.href = '/'}
                      className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-green-600 text-white font-medium rounded-2xl shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-green-700 transition-all duration-300 transform hover:scale-[1.02]"
                    >
                      Go to Dashboard
                    </button>
                    <button
                      onClick={handleSignOut}
                      disabled={isLoading}
                      className="w-full py-3 px-6 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-2xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-gray-400 border-t-gray-600 rounded-full animate-spin"></div>
                          Signing out...
                        </div>
                      ) : (
                        'Sign out'
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Built for Kasetsart University students
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useSession, signOut } from "next-auth/react";
import NotificationBell from "./notification/NotificationBell";
import useUserId from "./Note/useUserId";
import { useEffect, useState } from "react";


export default function Navbar() {
  const { data: session, status } = useSession();
  const userId = useUserId(); // UUID หรือ session.user.id
  const [mounted, setMounted] = useState(false);
  const [showShareDropdown, setShowShareDropdown] = useState(false);

  // รอจน client render
  useEffect(() => {
    setMounted(true);
  }, []);

  // log userId
  useEffect(() => {
    if (userId) {
      console.log("Current UUID:", userId);
      console.log("Type of user_id:", typeof userId);
      console.log("Length:", userId.length);
    }
  }, [userId]);

  const handleLogout = () => {
    signOut({ redirect: false });
    const newId = crypto.randomUUID();
    localStorage.setItem("userId", newId);
  };

  // รอจน client render และ session โหลดเสร็จ → ป้องกัน hydration error
  if (!mounted || status === "loading") return null;

  return (
    <main>
      <div className="fixed inset-x-0 top-0 border-b border-gray-950/5 dark:border-white/10 z-50">
        <nav className="bg-white dark:bg-gray-950">
          <div className="flex h-14 items-center justify-between gap-8 px-[100px] py-4">
            <div>
              <a href="/">
                <img src="/images/logo.png" alt="KUWHY_logo" className="w-20 h-20" />
              </a>
            </div>
            <ul className="flex items-center gap-6">
              <a
                className="block h-14 flex items-center px-4 text-black font-sans text-sm hover:bg-gray-100 transition"
                href="/"
              >
                Home
              </a>
                            {/* Share Dropdown */}
                <li className="relative">
                  <button 
                    className="block h-14 flex items-center px-4 text-black font-sans text-sm hover:bg-gray-100 transition"
                    onMouseEnter={() => setShowShareDropdown(true)}
                    onMouseLeave={() => setShowShareDropdown(false)}
                  >
                    Features
                  </button>
                  {showShareDropdown && (
                    <div 
                      className="absolute top-full left-0 bg-white border border-gray-200 rounded-md shadow-lg py-2 min-w-[120px]"
                      onMouseEnter={() => setShowShareDropdown(true)}
                      onMouseLeave={() => setShowShareDropdown(false)}
                    >
                      <a 
                        href="/note" 
                        className="block px-4 py-2 text-black font-sans text-sm hover:bg-gray-100 transition"
                      >
                        Note
                      </a>
                      <a 
                        href="/blog" 
                        className="block px-4 py-2 text-black font-sans text-sm hover:bg-gray-100 transition"
                      >
                        Blog
                      </a>
                    </div>
                  )}
                </li>
            
              {/* <a
                className="block h-14 flex items-center px-4 text-black font-sans text-sm hover:bg-gray-100 transition"
                href="#"
              >
                Project
              </a> */}
              <a
                className="block h-14 flex items-center px-4 text-black font-sans text-sm hover:bg-gray-100 transition"
                href="/about"
              >
                About us
              </a>
              <li>
                <NotificationBell />
              </li>
              <li>
                {!session ? (
                  <a
                    href="/login"
                    className="px-4 py-2 border border-black rounded-full text-black hover:bg-gray-100"
                  >
                    Login
                  </a>
                ) : (
                  <div className="flex items-center gap-2">
                    {session.user.image && (
                      <img
                        src={session.user.image}
                        alt="pfp"
                        className="w-8 h-8 rounded-full"
                      />
                    )}
                    <span>{session.user.name || "User"}</span>
                    <button
                      onClick={handleLogout}
                      className="px-2 py-1 border border-black rounded-full text-black hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </li>
            </ul>
          </div>
        </nav>
      </div>
    </main>
  );
}
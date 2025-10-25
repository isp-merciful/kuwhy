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
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // รอจน client render
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserDropdown && !event.target.closest('.user-dropdown')) {
        setShowUserDropdown(false);
      }
      if (showShareDropdown && !event.target.closest('.share-dropdown')) {
        setShowShareDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserDropdown, showShareDropdown]);

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
                <li className="relative share-dropdown">
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
                    className="px-4 py-2 border border-black rounded-full text-black hover:bg-gray-100 transition-colors"
                  >
                    Login
                  </a>
                ) : (
                  <div className="relative user-dropdown">
                    {/* User Profile Button */}
                    <button
                      onClick={() => setShowUserDropdown(!showUserDropdown)}
                      className="flex items-center gap-3 px-3 py-2 rounded-full hover:bg-gray-100 transition-colors"
                    >
                      {session.user.image && (
                        <img
                          src={session.user.image}
                          alt="Profile"
                          className="w-8 h-8 rounded-full border-2 border-gray-200"
                        />
                      )}
                      <span className="text-sm font-medium text-gray-700">
                        {session.user.name || "User"}
                      </span>
                      <svg 
                        className={`w-4 h-4 text-gray-500 transition-transform ${showUserDropdown ? 'rotate-180' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* User Dropdown Menu */}
                    {showUserDropdown && (
                      <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50">
                        {/* Profile Info */}
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="text-sm font-medium text-gray-900">
                            {session.user.name || "User"}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {session.user.email}
                          </p>
                        </div>

                        {/* Menu Items */}
                        <div className="py-1">
                          <a
                            href="/profile"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                            onClick={() => setShowUserDropdown(false)}
                          >
                            <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Profile Settings
                          </a>
                          
                          <a
                            href="/"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                            onClick={() => setShowUserDropdown(false)}
                          >
                            <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            Dashboard
                          </a>
                        </div>

                        {/* Logout */}
                        <div className="border-t border-gray-100 pt-1">
                          <button
                            onClick={() => {
                              setShowUserDropdown(false);
                              handleLogout();
                            }}
                            className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Sign Out
                          </button>
                        </div>
                      </div>
                    )}
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

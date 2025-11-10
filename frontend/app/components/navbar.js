'use client';

import { useSession, signOut } from 'next-auth/react';
import NotificationBell from './notification/NotificationBell';
import useUserId from './Note/useUserId';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const { data: session, status } = useSession();
  const userId = useUserId(); // local uuid (fallback)
  const [mounted, setMounted] = useState(false);
  const [showShareDropdown, setShowShareDropdown] = useState(false);

  // รอ client mount เพื่อกัน hydration mismatch
  useEffect(() => setMounted(true), []);

  // ซิงก์ localStorage.userId ให้ใช้ session.user.id เมื่อ login แล้ว
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      const current = localStorage.getItem('userId');
      if (current !== session.user.id) {
        localStorage.setItem('userId', session.user.id);
      }
    }
  }, [status, session?.user?.id]);

  // debug id
  useEffect(() => {
    const id = status === 'authenticated' ? session?.user?.id : userId;
    if (id) {
      console.log('Current UUID:', id);
      console.log('Type of user_id:', typeof id);
      console.log('Length:', String(id).length);
    }
  }, [status, session?.user?.id, userId]);

  const handleLogout = async () => {
    // ออกจากระบบ + ให้ NextAuth redirect เพื่อรีเฟรช session state ทั้งแอพ
    await signOut({ callbackUrl: '/' });
    // สร้าง anon id ใหม่สำหรับ guest โหมด (หลัง redirect แล้วจะวิ่งอีกครั้ง)
    try {
      const newId = crypto.randomUUID();
      localStorage.setItem('userId', newId);
    } catch {}
  };

  if (!mounted || status === 'loading') return null;

  const isAuthed = status === 'authenticated';
  const avatarSrc = (session?.user?.image && String(session.user.image)) || '/images/pfp.png';
  const displayName = session?.user?.name || 'User';

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

              {/* Features Dropdown (จับ hover จากกล่องครอบกันกะพริบ) */}
              <li
                className="relative"
                onMouseEnter={() => setShowShareDropdown(true)}
                onMouseLeave={() => setShowShareDropdown(false)}
              >
                <button className="block h-14 flex items-center px-4 text-black font-sans text-sm hover:bg-gray-100 transition">
                  Features
                </button>
                {showShareDropdown && (
                  <div className="absolute top-full left-0 bg-white border border-gray-200 rounded-md shadow-lg py-2 min-w-[140px]">
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
                {!isAuthed ? (
                  <a
                    href="/login"
                    className="px-4 py-2 border border-black rounded-full text-black hover:bg-gray-100"
                  >
                    Login
                  </a>
                ) : (
                  <div className="flex items-center gap-2">
                    <img
                      src={avatarSrc}
                      alt="pfp"
                      className="w-8 h-8 rounded-full object-cover"
                      // ป้องกันรูปเน่าหรือโดเมนไม่อนุญาต → fallback
                      onError={(e) => {
                        if (e.currentTarget.src !== '/images/pfp.png') {
                          e.currentTarget.src = '/images/pfp.png';
                        }
                      }}
                    />
                    <span className="text-sm">{displayName}</span>
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

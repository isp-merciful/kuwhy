'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import NotificationBell from './notification/NotificationBell';
import useUserId from './Note/useUserId';
import { useEffect, useRef, useState } from 'react';

export default function Navbar() {
  const { data: session, status } = useSession();
  const userId = useUserId(); // UUID หรือ session.user.id (ตาม hook ของคุณ)
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  // รอจน client render (กัน hydration mismatch)
  useEffect(() => {
    setMounted(true);
  }, []);

  // debug userId (เฉพาะตอนมีค่า)
  useEffect(() => {
    if (userId) {
      console.log('Current UUID:', userId);
      console.log('Type of user_id:', typeof userId);
      console.log('Length:', userId.length);
    }
  }, [userId]);

  // ปิด dropdown เมื่อคลิกนอก หรือกด ESC
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // safe UUID fallback
  const makeUUID = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    // fallback (RFC4122-ish)
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };

  const handleLogout = async () => {
    // ออกจากระบบแบบไม่ redirect ทันที (คุมเอง)
    await signOut({ redirect: false });
    // ออกแล้วออก ID 匿名 ใหม่ให้
    const newId = makeUUID();
    try {
      localStorage.setItem('userId', newId);
    } catch {}
    // กลับหน้าแรก
    if (typeof window !== 'undefined') window.location.href = '/';
  };

  // กัน hydration; render หลัง mounted และรอ session โหลดเสร็จ
  if (!mounted || status === 'loading') return null;

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-gray-950/5 dark:border-white/10 bg-white dark:bg-gray-950">
      <nav className="mx-auto max-w-7xl">
        <div className="flex h-16 items-center justify-between gap-6 px-6">
          {/* Logo */}
          <div className="shrink-0">
            <Link href="/" className="inline-flex items-center gap-2">
              <img src="/images/logo.png" alt="KUWHY_logo" className="w-10 h-10" />
              <span className="sr-only">KUWHY</span>
            </Link>
          </div>

          {/* Menu */}
          <ul className="flex items-center gap-1">
            <li>
              <Link
                href="/"
                className="block h-10 leading-10 px-4 rounded-md text-sm hover:bg-gray-100 dark:hover:bg-white/10 transition"
              >
                Home
              </Link>
            </li>

            {/* Features dropdown */}
            <li className="relative" ref={dropdownRef}>
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={open}
                onClick={() => setOpen((s) => !s)}
                className="block h-10 leading-10 px-4 rounded-md text-sm hover:bg-gray-100 dark:hover:bg-white/10 transition"
              >
                Features
              </button>

              {open && (
                <div
                  role="menu"
                  className="absolute top-[110%] left-0 min-w-[160px] rounded-md border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 shadow-lg py-2"
                >
                  <Link
                    href="/note"
                    role="menuitem"
                    className="block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-white/10 transition"
                    onClick={() => setOpen(false)}
                  >
                    Note
                  </Link>
                  <Link
                    href="/blog"
                    role="menuitem"
                    className="block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-white/10 transition"
                    onClick={() => setOpen(false)}
                  >
                    Blog
                  </Link>
                </div>
              )}
            </li>

            <li>
              <Link
                href="/about"
                className="block h-10 leading-10 px-4 rounded-md text-sm hover:bg-gray-100 dark:hover:bg-white/10 transition"
              >
                About us
              </Link>
            </li>

            {/* Notification */}
            <li className="ml-1">
              <NotificationBell />
            </li>

            {/* Auth */}
            <li className="ml-2">
              {session ? (
                <div className="flex items-center gap-2">
                  {session.user?.image && (
                    <img
                      src={session.user.image}
                      alt="pfp"
                      className="w-8 h-8 rounded-full border border-black/10"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <span className="text-sm truncate max-w-[140px]">
                    {session.user?.name || 'User'}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="px-3 h-9 inline-flex items-center rounded-full border border-black text-sm hover:bg-gray-100 dark:hover:bg-white/10 transition"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="px-4 h-9 inline-flex items-center rounded-full border border-black text-sm hover:bg-gray-100 dark:hover:bg-white/10 transition"
                >
                  Login
                </Link>
              )}
            </li>
          </ul>
        </div>
      </nav>
    </header>
  );
}

'use client';

import { useSession, signOut } from 'next-auth/react';
import { useEffect, useRef, useState } from 'react';
import NotificationBell from './notification/NotificationBell';

import {
  ChevronDownIcon,
  PencilSquareIcon,
  NewspaperIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  ShieldCheckIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';

export default function Navbar() {
  const { data: session, status } = useSession();

  const [mounted, setMounted] = useState(false);
  const [showFeatures, setShowFeatures] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const featuresRef = useRef(null);
  const profileRef = useRef(null);
  const bellRef = useRef(null);
  const closeTimer = useRef(null);

  useEffect(() => setMounted(true), []);

  // anti-flicker open/close helpers
  const openWithGrace = (setter) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setter(true);
  };
  const closeWithDelay = (setter, ms = 160) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setter(false), ms);
  };
  const closeAll = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setShowFeatures(false);
    setShowProfile(false);
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
    try { localStorage.setItem('userId', crypto.randomUUID()); } catch {}
  };

  if (!mounted || status === 'loading') return null;

  const isAuthed = status === 'authenticated';
  const isAdmin = session?.user?.role === 'admin';
  const avatarSrc = (session?.user?.image && String(session.user.image)) || '/images/pfp.png';
  const displayName = session?.user?.name || 'User';

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="bg-white/85 supports-[backdrop-filter]:backdrop-blur-md border-b border-black/5">
        <nav className="max-w-7xl mx-auto">
          <div className="flex h-16 items-center px-4 sm:px-6">
            {/* Brand */}
            <a href="/" className="inline-flex items-center select-none">
              <span className="text-xl sm:text-2xl font-extrabold tracking-tight bg-gradient-to-r from-[#1E6BFF] via-[#1fb67a] to-[#16A34A] bg-clip-text text-transparent">
                KU&nbsp;WHY
              </span>
            </a>

            {/* Right side */}
            <div className="ml-auto flex items-center gap-2">
              <ul className="hidden md:flex items-center gap-1">
                <NavLink href="/">Home</NavLink>

                {/* Features */}
                <li
                  ref={featuresRef}
                  className="relative"
                  onMouseEnter={() => { closeAll(); openWithGrace(setShowFeatures); }}
                  onMouseLeave={() => closeWithDelay(setShowFeatures)}
                >
                  <button
                    className="relative inline-flex items-center px-3 py-2 rounded-xl text-sm font-medium
                               text-emerald-900 transition-[transform,box-shadow] duration-150 will-change-transform
                               hover:scale-[1.05] group"
                    onClick={() => { setShowProfile(false); setShowFeatures(v => !v); }}
                    aria-haspopup="menu"
                    aria-expanded={showFeatures}
                  >
                    <span>Features</span>
                    <ChevronDownIcon className={`ml-1 h-4 w-4 transition-transform duration-150 ${showFeatures ? 'rotate-180' : ''}`} />
                    <Underline />
                  </button>

                  {/* guard gap */}
                  <div
                    className={
                      `absolute right-0 top-[calc(100%+8px)] min-w-[240px] origin-top-right rounded-2xl border border-emerald-900/10 bg-white shadow-xl transition-[opacity,transform] duration-150 ease-out will-change-transform 
                      ${showFeatures ? 'opacity-100 scale-100' : 'pointer-events-none opacity-0 scale-95'}`
                    }
                    role="menu"
                  >
                    <div className="p-2">
                      <DropdownItem
                        href="/note"
                        icon={<PencilSquareIcon className="h-5 w-5" />}
                        label="Note"
                        desc="Write & collaborate"
                      />
                      <DropdownItem
                        href="/blog"
                        icon={<NewspaperIcon className="h-5 w-5" />}
                        label="Blog"
                        desc="Share ideas"
                      />
                    </div>
                  </div>
                </li>

                <NavLink href="/about">About us</NavLink>

                {isAdmin && (
                  <a href="/admin" className="relative inline-flex items-center px-3 py-2 rounded-xl text-sm font-medium
                                             text-emerald-900 transition-[transform,box-shadow] duration-150 will-change-transform
                                             hover:scale-[1.05] group">
                    <span>Admin</span>
                    <ShieldCheckIcon className="ml-1 h-4 w-4" />
                    <Underline />
                  </a>
                )}
              </ul>

              {/* bell – hovering here closes all */}
              <div
                ref={bellRef}
                className="hidden sm:block relative z-40"
                onMouseEnter={closeAll}
                onFocus={closeAll}
              >
                <NotificationBell />
              </div>

              {/* auth */}
              {!isAuthed ? (
                <a
                  href="/login"
                  onMouseEnter={closeAll}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-emerald-950
                             bg-gradient-to-r from-sky-200 via-emerald-200 to-green-200
                             shadow-[0_8px_22px_-14px_rgba(16,185,129,0.45)]
                             transition-transform duration-150 hover:scale-[1.04] focus:outline-none
                             focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
                  title="Login"
                >
                  Login
                </a>
              ) : (
                <ProfileMenu
                  refEl={profileRef}
                  openWithGrace={openWithGrace}
                  closeWithDelay={closeWithDelay}
                  show={showProfile}
                  setShow={(v) => { if (v) setShowFeatures(false); setShowProfile(v); }}
                  avatarSrc={avatarSrc}
                  displayName={displayName}
                  onLogout={handleLogout}
                />
              )}
            </div>
          </div>
        </nav>
      </div>

      {/* spacer */}
      <div className="h-16" />
    </header>
  );
}

/* ---------- ProfileMenu ---------- */

function ProfileMenu({
  refEl,
  openWithGrace,
  closeWithDelay,
  show,
  setShow,
  avatarSrc,
  displayName,
  onLogout,
}) {
  return (
    <div
      ref={refEl}
      className="relative"
      onMouseEnter={() => openWithGrace(setShow)}
      onMouseLeave={() => closeWithDelay(setShow)}
    >
      <button
        className="inline-flex items-center gap-2 px-2 py-1 rounded-lg transition-transform duration-150 hover:scale-[1.02]"
        onClick={() => setShow(v => !v)}
        aria-haspopup="menu"
        aria-expanded={show}
      >
        <img
          src={avatarSrc}
          alt="Profile"
          className="w-9 h-9 rounded-full object-cover"
          onError={(e) => { if (e.currentTarget.src !== '/images/pfp.png') e.currentTarget.src = '/images/pfp.png'; }}
        />
        <span className="hidden sm:block text-sm font-medium">{displayName}</span>
        <ChevronDownIcon className={`hidden sm:block h-4 w-4 transition-transform duration-150 ${show ? 'rotate-180' : ''}`} />
      </button>

      <div
        className={`z-40 absolute right-0 top-[calc(100%+8px)] w-[200px] origin-top-right
                    rounded-xl bg-white shadow-[0_16px_36px_-26px_rgba(0,0,0,0.45)]
                    transition-[opacity,transform] duration-180 will-change-transform
                    ${show ? 'opacity-100 scale-100' : 'pointer-events-none opacity-0 scale-95'}`}
        role="menu"
      >
        <div className="p-1">
          <MenuRow href="/profile"  icon={<UserCircleIcon className="h-4 w-4" />} text="Profile" />
          <Divider />
          <MenuRow href="/settings" icon={<Cog6ToothIcon  className="h-4 w-4" />} text="Settings" />
          <Divider />
          <MenuButton
            onClick={onLogout}
            icon={<ArrowRightOnRectangleIcon className="h-4 w-4" />}
            text="Logout"
            danger
          />
        </div>
      </div>
    </div>
  );
}

/* ---------- Reusable Components ---------- */

function Underline() {
  return (
    <span
      className="pointer-events-none absolute left-3 right-3 -bottom-[2px] h-[2px]
                 bg-gradient-to-r from-[#1E6BFF] via-[#1fb67a] to-[#16A34A]
                 scale-x-0 group-hover:scale-x-100 transition-transform origin-left rounded-full will-change-transform"
    />
  );
}

function NavLink({ href, children }) {
  return (
    <a
      href={href}
      className="relative inline-flex items-center px-3 py-2 rounded-xl text-sm font-medium
                 text-emerald-900 transition-[transform,box-shadow] duration-150 will-change-transform
                 hover:scale-[1.05] group"
    >
      <span>{children}</span>
      <Underline />
    </a>
  );
}

function DDRow({ href, icon, text }) {
  return (
    <a
      href={href}
      className="w-full inline-flex justify-center items-center gap-2 px-2 h-9 text-[14px] text-gray-900 rounded-lg
                 hover:bg-[rgba(0,0,0,0.04)] transition-colors"
    >
      {icon}
      <span className="text-center">{text}</span>
    </a>
  );
}

function MenuRow({ href, icon, text }) {
  return (
    <a
      href={href}
      className="w-full inline-flex justify-center items-center gap-2 px-2 h-9 text-[14px] text-gray-900 rounded-lg
                 hover:bg-[rgba(0,0,0,0.04)] transition-colors"
    >
      {icon}
      <span className="text-center">{text}</span>
    </a>
  );
}

function MenuButton({ onClick, icon, text, danger = false }) {
  return (
    <button
      onClick={onClick}
      className={`w-full inline-flex justify-center items-center gap-2 px-2 h-9 text-[14px] rounded-lg transition-colors
                 ${danger
                   ? 'text-red-600 hover:bg-red-50'
                   : 'text-gray-900 hover:bg-[rgba(0,0,0,0.04)]'}`}
    >
      {icon}
      <span className="text-center">{text}</span>
    </button>
  );
}

function Divider() {
  return <div className="h-px bg-black/10 my-1" />;


}

function DropdownItem({ href, icon, label, desc }) {
  return (
    <a
      href={href}
      className="flex items-start gap-3 rounded-xl px-3 py-2 hover:bg-emerald-50 transition-colors"
    >
      <div className="mt-0.5 text-emerald-600">{icon}</div>
      <div className="flex flex-col">
        <span className="text-sm font-medium text-emerald-900">{label}</span>
        {desc && (
          <span className="text-xs text-emerald-800/70">{desc}</span>
        )}
      </div>
    </a>
  );
}

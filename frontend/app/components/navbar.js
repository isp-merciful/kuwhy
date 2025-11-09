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
  const closeTimer = useRef(null);

  useEffect(() => setMounted(true), []);

  const openWithGrace = (setter) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setter(true);
  };
  const closeWithDelay = (setter, ms = 140) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setter(false), ms);
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
    try {
      localStorage.setItem('userId', crypto.randomUUID());
    } catch {}
  };

  if (!mounted || status === 'loading') return null;

  const isAuthed = status === 'authenticated';
  const isAdmin = session?.user?.role === 'admin';
  const avatarSrc =
    (session?.user?.image && String(session.user.image)) ||
    '/images/pfp.png';
  const displayName = session?.user?.name || 'User';

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="bg-white/85 supports-[backdrop-filter]:backdrop-blur-md border-b border-emerald-900/10">
        <nav className="max-w-7xl mx-auto">
          <div className="flex h-16 items-center px-4 sm:px-6">
            {/* Brand */}
            <a href="/" className="inline-flex items-center">
              <span className="text-lg sm:text-xl font-extrabold tracking-wide text-emerald-700">
                KUWHY
              </span>
            </a>

            {/* Right side */}
            <div className="ml-auto flex items-center gap-2">
              <ul className="hidden md:flex items-center gap-2">
                <NavLink href="/">Home</NavLink>

                {/* Hover dropdown for Features */}
                <li
                  ref={featuresRef}
                  className="relative"
                  onMouseEnter={() => openWithGrace(setShowFeatures)}
                  onMouseLeave={() => closeWithDelay(setShowFeatures)}
                >
                  <button
                    className={`nav-pill inline-flex items-center gap-1 ${
                      showFeatures ? 'ring-1 ring-emerald-500/20' : ''
                    }`}
                    onClick={() => setShowFeatures((v) => !v)}
                    aria-haspopup="menu"
                    aria-expanded={showFeatures}
                  >
                    Features
                    <ChevronDownIcon
                      className={`h-4 w-4 transition-transform duration-200 will-change-transform ${
                        showFeatures ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  <div
                    className={`absolute right-0 top-[calc(100%+8px)] min-w-[240px] origin-top-right rounded-2xl border border-emerald-900/10
                                bg-white shadow-xl transition-[opacity,transform] duration-150 ease-out will-change-transform
                                ${
                                  showFeatures
                                    ? 'opacity-100 scale-100'
                                    : 'pointer-events-none opacity-0 scale-95'
                                }`}
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
                  <a
                    href="/admin"
                    className="nav-pill inline-flex items-center gap-1"
                  >
                    <ShieldCheckIcon className="h-4 w-4" />
                    Admin
                  </a>
                )}
              </ul>

              <div className="hidden sm:block">
                <NotificationBell />
              </div>

              {!isAuthed ? (
                <a
                  href="/login"
                  className="nav-pill inline-flex items-center"
                >
                  Login
                </a>
              ) : (
                <ProfileMenu
                  refEl={profileRef}
                  openWithGrace={openWithGrace}
                  closeWithDelay={closeWithDelay}
                  show={showProfile}
                  setShow={setShowProfile}
                  avatarSrc={avatarSrc}
                  displayName={displayName}
                  onLogout={handleLogout}
                />
              )}
            </div>
          </div>
        </nav>
      </div>

      <div className="h-16" />

      <style jsx global>{`
        @media (prefers-reduced-motion: reduce) {
          * {
            transition: none !important;
            animation: none !important;
          }
        }
        .nav-pill {
          @apply px-3 py-2 rounded-xl text-sm font-medium text-emerald-900
                 bg-white border border-emerald-900/10 transition-[transform,box-shadow,background-color] duration-150
                 hover:scale-[1.03] hover:bg-emerald-50;
        }
        .nav-ghost {
          @apply px-2 py-1 rounded-xl text-emerald-900
                 transition-colors duration-150 hover:bg-emerald-900/5;
        }
        .menu-item {
          @apply w-full inline-flex items-center gap-3 px-3 py-2 rounded-lg text-sm
                 text-emerald-900 hover:bg-emerald-50 transition-colors;
        }
      `}</style>
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
      {/* Profile Button */}
      <button
        className={`nav-ghost group inline-flex items-center gap-2 ${
          show ? 'ring-1 ring-emerald-500/20' : ''
        }`}
        onClick={() => setShow((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={show}
      >
        <img
          src={avatarSrc}
          alt="Profile"
          className="w-9 h-9 rounded-full object-cover ring-1 ring-emerald-900/10 transition-transform duration-150 group-hover:scale-105 will-change-transform"
          onError={(e) => {
            if (e.currentTarget.src !== '/images/pfp.png')
              e.currentTarget.src = '/images/pfp.png';
          }}
        />
        <span className="hidden sm:block text-sm font-medium">
          {displayName}
        </span>
        <ChevronDownIcon
          className={`hidden sm:block h-4 w-4 transition-transform duration-150 will-change-transform ${
            show ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown */}
      <div
        className={`absolute right-0 top-[calc(100%+8px)] w-52 origin-top-right rounded-2xl border border-emerald-900/10
                    bg-white shadow-lg overflow-hidden transition-all duration-150 ease-out
                    ${
                      show
                        ? 'opacity-100 scale-100 translate-y-0'
                        : 'pointer-events-none opacity-0 scale-95 -translate-y-1'
                    }`}
        role="menu"
      >
        <div className="flex flex-col divide-y divide-emerald-900/10">
          <a
            href="/profile"
            className="menu-item justify-center py-3 text-center font-medium hover:bg-emerald-50"
            role="menuitem"
          >
            <UserCircleIcon className="h-5 w-5 mr-1 inline-block text-emerald-700" />
            Profile
          </a>

          <a
            href="/settings"
            className="menu-item justify-center py-3 text-center font-medium hover:bg-emerald-50"
            role="menuitem"
          >
            <Cog6ToothIcon className="h-5 w-5 mr-1 inline-block text-emerald-700" />
            Settings
          </a>

          <button
            onClick={onLogout}
            className="menu-item justify-center py-3 text-center font-medium hover:bg-red-50 text-red-600 transition-colors"
            role="menuitem"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5 mr-1 inline-block" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Reusable Components ---------- */

function NavLink({ href, children }) {
  return (
    <a
      href={href}
      className="relative inline-flex items-center px-3 py-2 rounded-xl text-sm font-medium
                 text-emerald-900 transition-[transform,box-shadow] duration-150 will-change-transform
                 hover:scale-[1.05] group"
    >
      <span>{children}</span>
      <span
        className="pointer-events-none absolute left-3 right-3 -bottom-[2px] h-[2px]
                       bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500
                       scale-x-0 group-hover:scale-x-100 transition-transform origin-left rounded-full will-change-transform"
      />
    </a>
  );
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

"use client";
import { useState } from "react";

export function Navbar() {
  const [showShareDropdown, setShowShareDropdown] = useState(false);

  return (
    <main>
        <div className="fixed inset-x-0 top-0 border-b border-gray-950/5 dark:border-white/10 z-50">
        <nav className="bg-white dark:bg-gray-950">
          
            <div className="flex h-14 items-center justify-between gap-8 px-[100px] py-8">
              <div>
                <a href="/"><img src="/images/logo.png" alt="KUWHY_logo" className="w-20 h-20" /></a>
              </div>
              <ul className="flex items-center gap-6 ">
                <a className="block h-14 flex items-center px-4 text-black font-sans text-sm hover:bg-gray-100 transition" href="/">Home</a>
                
                {/* Share Dropdown */}
                <li className="relative">
                  <button 
                    className="block h-14 flex items-center px-4 text-black font-sans text-sm hover:bg-gray-100 transition"
                    onMouseEnter={() => setShowShareDropdown(true)}
                    onMouseLeave={() => setShowShareDropdown(false)}
                  >
                    Share
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
                
                <a className="block h-14 flex items-center px-4 text-black font-sans text-sm hover:bg-gray-100 transition" href="#">Project</a>
                <a className="block h-14 flex items-center px-4 text-black font-sans text-sm hover:bg-gray-100 transition" href="#">About us</a>
                <li><a href="/login" className="px-4 py-2 border border-black rounded-full text-black hover:bg-gray-100">Login</a></li>
              </ul>          
            </div>
          

        </nav>
        </div>

    </main>
  )
}

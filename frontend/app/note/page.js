"use client";

import { useState, useEffect } from "react";
import NoteBubble from "../components/Note/NoteBubble";
import NoteContainer from "../components/Note/NoteContainer";
import { AnimatePresence, motion } from "framer-motion";

export default function NotePage() {
  const [isComposing, setIsComposing] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null; 
  return (
    <main className="relative min-h-screen bg-gradient-to-b from-[#DDF3FF] to-[#E8FFF2] flex flex-col items-center pt-24 overflow-hidden">
      <motion.section
        layout
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="w-full max-w-5xl flex flex-col items-center"
      >
        <NoteBubble isComposing={isComposing} setIsComposing={setIsComposing} />

        <AnimatePresence>
          {!isComposing && (
            <motion.div
              key="container"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ duration: 0.5 }}
              className="w-full mt-12"
            >
              <h2 className="text-xl font-semibold text-gray-800">
                Community Notes
              </h2>
              <div className="p-6">
                <NoteContainer />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>
    </main>
  );
}

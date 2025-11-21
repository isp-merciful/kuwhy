"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";

export default function ConfirmReplaceDialog({
  open,
  onClose,
  onConfirm,
  busy = false,
  title = "Replace current note?",
  description = "This will overwrite your existing note for everyone.",
  confirmText = "Replace",
  cancelText = "Cancel",
}) {
  const [mounted, setMounted] = useState(false);
  const cancelRef = useRef(null);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  useEffect(() => {
    if (open) setTimeout(() => cancelRef.current?.focus(), 0);
  }, [open]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[1000] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => !busy && onClose?.()}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            className="relative z-[1001] w-[min(96vw,440px)] rounded-xl bg-white p-6 shadow-lg ring-1 ring-black/5"
            initial={{ y: 10, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 10, scale: 0.98, opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 26 }}
          >
            {/* Close */}
            <button
              onClick={() => !busy && onClose?.()}
              className="absolute right-3 top-3 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              aria-label="Close"
              disabled={busy}
            >
              <XMarkIcon className="h-5 w-5" />
            </button>

            {/* Header */}
            <div className="flex items-start gap-4">
              <div className="mt-0.5 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 ring-1 ring-blue-100">
                <PlusIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-semibold text-gray-900 leading-6 whitespace-nowrap overflow-hidden text-ellipsis">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">
                  {description}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                ref={cancelRef}
                onClick={() => !busy && onClose?.()}
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 disabled:opacity-50"
                disabled={busy}
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50"
                disabled={busy}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

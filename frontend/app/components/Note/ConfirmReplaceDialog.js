// frontend/app/components/notes/ConfirmReplaceDialog.jsx
"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";

/**
 * ConfirmReplaceDialog
 * props:
 *  - open: boolean
 *  - onClose: () => void
 *  - onConfirm: () => void | Promise<void>
 *  - busy?: boolean
 *  - title?: string
 *  - description?: string | JSX.Element
 *  - confirmText?: string (default: "Replace")
 *  - cancelText?: string  (default: "Cancel")
 */
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
          {/* backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => !busy && onClose?.()}
          />

          {/* card */}
          <motion.div
            role="dialog"
            aria-modal="true"
            className="relative z-[1001] w-[92%] max-w-md rounded-2xl bg-white p-5 shadow-xl"
            initial={{ scale: 0.96, y: 6, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, y: 6, opacity: 0 }}
          >
            {/* close(X) */}
            <button
              onClick={() => !busy && onClose?.()}
              className="absolute right-3 top-3 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              aria-label="Close"
              disabled={busy}
            >
              <XMarkIcon className="h-5 w-5" />
            </button>

            {/* header */}
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-blue-50">
                <PlusIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  {title}
                </h3>
                <p className="mt-1 text-sm text-gray-500">{description}</p>
              </div>
            </div>

            {/* actions */}
            <div className="mt-6 flex justify-end gap-3">
              <button
                ref={cancelRef}
                onClick={() => !busy && onClose?.()}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50"
                disabled={busy}
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
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

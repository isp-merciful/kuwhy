"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

const API = "http://localhost:8000/api";

const TYPE_LABEL = {
  note: "note",
  comment: "comment",
  blog: "blog post",
  party_chat: "party chat message",
};

export default function ReportDialog({ targetType, targetId, onClose }) {
  const { data: session } = useSession();
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showToast, setShowToast] = useState(false);

  const label = TYPE_LABEL[targetType] || targetType || "content";
  const title = `Report ${label}${targetId ? ` #${targetId}` : ""}`;

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setErrorMsg("");

    try {
      const payload = {
        targetType,
        targetId,
        reason: reason.trim() || null,
        details: details.trim() || null,
      };

      const res = await fetch(`${API}/report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.apiToken
            ? { Authorization: `Bearer ${session.apiToken}` }
            : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data?.error) {
        setErrorMsg(data?.error || "Failed to submit report. Please try again.");
        return;
      }

      // ✅ แทน alert → ใช้ toast สวย ๆ
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        onClose?.();
      }, 1500);
    } catch (err) {
      setErrorMsg("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {/* overlay */}
      <div className="fixed inset-0 z-[80] bg-black/40 flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl p-6 relative">
          {/* ปุ่มปิดมุมขวาบน */}
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            <span className="block text-lg leading-none">×</span>
          </button>

          <h2 className="text-lg font-bold text-slate-900 mb-1">
            {title}
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Help our admins keep the community safe. Reports are private and only visible to moderators.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* reason */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason <span className="text-slate-400">(optional)</span>
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Spam, abuse, inappropriate content..."
                maxLength={200}
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
              />
              <div className="mt-1 text-[11px] text-slate-400 text-right">
                {reason.length}/200
              </div>
            </div>

            {/* details */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Details <span className="text-slate-400">(optional)</span>
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={4}
                placeholder="Describe what's wrong, or add any context that might help moderators..."
                maxLength={2000}
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 resize-none"
              />
              <div className="mt-1 text-[11px] text-slate-400 text-right">
                {details.length}/2000
              </div>
            </div>

            {errorMsg && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                {errorMsg}
              </p>
            )}

            <div className="mt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="rounded-full border border-slate-200 px-4 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-full bg-amber-600 px-5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-700 disabled:opacity-60"
              >
                {submitting ? "Sending..." : "Submit report"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* toast หลังส่งสำเร็จ */}
      {showToast && (
        <div className="fixed bottom-4 left-1/2 z-[90] -translate-x-1/2 rounded-full bg-emerald-600 px-4 py-2 text-sm text-white shadow-lg">
          Report submitted. Thank you. 🙏
        </div>
      )}
    </>
  );
}

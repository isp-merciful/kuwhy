"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

const API_BASE = "http://localhost:8000";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [mode, setMode] = useState("request"); 

  // step 1: request reset link
  const [email, setEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState("");
  const [emailError, setEmailError] = useState("");

  // step 2: reset password
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [resetStatus, setResetStatus] = useState("");

  const [globalError, setGlobalError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // อ่าน token / error จาก query
  useEffect(() => {
    const t = searchParams.get("token");
    const err = searchParams.get("error");

    if (err) {
      if (err === "invalid_or_expired") {
        setGlobalError(
          "This reset link is invalid or has expired. Please request a new one."
        );
      } else if (err === "missing_token") {
        setGlobalError("Missing reset token. Please request a new link.");
      } else {
        setGlobalError("Something went wrong. Please request a new link.");
      }

      setMode("request");
      setToken("");
      return;
    }

    if (t) {
      setToken(t);
      setMode("reset");
      setGlobalError("");
    } else {
      setMode("request");
      setToken("");
      setGlobalError("");
    }
  }, [searchParams]);

  /* ---------- helpers ---------- */

  async function safeJson(res) {
    const ct = res.headers.get("content-type") || "";
    try {
      if (ct.includes("application/json")) {
        return await res.json();
      } else {
        const text = await res.text();
        console.error(
          "Non-JSON response from API:",
          res.url,
          "status:",
          res.status,
          "body:",
          text.slice(0, 300)
        );
        return {};
      }
    } catch (err) {
      console.error("Failed to parse JSON from API:", res.url, err);
      return {};
    }
  }

  /* ---------- handlers ---------- */

  const handleRequestLink = async (e) => {
    e.preventDefault();
    setEmailStatus("");
    setEmailError("");
    setGlobalError("");

    if (!email.trim()) {
      setEmailError("Email is required.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await safeJson(res);

      if (!res.ok) {
        setGlobalError(data.error || "Failed to send reset link.");
      } else {
        setEmailStatus(
          "If this email is registered, we’ve sent a reset link to your inbox."
        );
      }
    } catch (err) {
      console.error("Request forgot-password failed:", err);
      setGlobalError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetStatus("");
    setGlobalError("");

    if (!password.trim() || !confirm.trim()) {
      setGlobalError("Please fill all fields.");
      return;
    }
    if (password.length < 6) {
      setGlobalError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setGlobalError("Password confirmation does not match.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await safeJson(res);

      if (!res.ok) {
        setGlobalError(data.error || "Failed to reset password.");
      } else {
        setResetStatus(
          "Password reset successful. You can now sign in with your new password."
        );
        setTimeout(() => {
          router.push("/login"); 
        }, 2000);
      }
    } catch (err) {
      console.error("Reset password failed:", err);
      setGlobalError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const goBackToLogin = () => {
    router.push("/login");
  };

  /* ---------- UI ---------- */

  const title = mode === "request" ? "Forgot password" : "Set a new password";
  const subtitle =
    mode === "request"
      ? "Enter the email you used to sign up. We’ll send you a link to reset your password."
      : "Please enter your new password. This link is valid for 24 hours.";

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-[#f2fbf6] to-[#eef6ff]">
      <main className="mx-auto mt-16 sm:mt-24 flex max-w-6xl justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="rounded-3xl border bg-white shadow-xl">
            <div className="p-6 sm:p-8">
              <div className="text-center mb-6">
                <h2 className="text-sm font-medium text-gray-700">KU WHY</h2>
                <div className="text-xl font-bold text-gray-900 mt-1">
                  {title}
                </div>
                <p className="mt-2 text-xs text-gray-500">{subtitle}</p>
              </div>

              {globalError && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600">
                  {globalError}
                </div>
              )}

              {/* MODE: request reset link */}
              {mode === "request" && (
                <form onSubmit={handleRequestLink} className="space-y-4">
                  <div>
                    <label
                      htmlFor="email"
                      className="mb-1 block text-sm text-gray-700"
                    >
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setEmailError("");
                      }}
                      placeholder="Enter your email"
                      className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        emailError
                          ? "border-red-300 bg-red-50"
                          : "border-gray-200"
                      }`}
                      autoComplete="email"
                    />
                    {emailError && (
                      <p className="mt-1 text-xs text-red-600">{emailError}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-green-600 py-2.5 text-sm font-medium text-white shadow hover:from-blue-700 hover:to-green-700 disabled:opacity-50"
                  >
                    {isLoading ? "Sending reset link…" : "Send reset link"}
                  </button>

                  {emailStatus && (
                    <p className="mt-2 text-xs text-green-600">
                      {emailStatus}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={goBackToLogin}
                    className="mt-4 w-full rounded-lg border bg-white py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Back to sign in
                  </button>
                </form>
              )}

              {/* MODE: reset password */}
              {mode === "reset" && (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label
                      htmlFor="password"
                      className="mb-1 block text-sm text-gray-700"
                    >
                      New password
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      autoComplete="new-password"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="confirm"
                      className="mb-1 block text-sm text-gray-700"
                    >
                      Confirm new password
                    </label>
                    <input
                      id="confirm"
                      type="password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="Confirm new password"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      autoComplete="new-password"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-green-600 py-2.5 text-sm font-medium text-white shadow hover:from-blue-700 hover:to-green-700 disabled:opacity-50"
                  >
                    {isLoading ? "Updating password…" : "Update password"}
                  </button>

                  {resetStatus && (
                    <p className="mt-2 text-xs text-green-600">
                      {resetStatus}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={goBackToLogin}
                    className="mt-4 w-full rounded-lg border bg-white py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Back to sign in
                  </button>
                </form>
              )}
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-gray-500">
            Built for Kasetsart University students
          </p>
        </div>
      </main>
    </div>
  );
}

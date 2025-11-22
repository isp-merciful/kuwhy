"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession, signOut } from "next-auth/react";

const API_BASE =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

const ROUTES = {
  getUser: (id) => `${API_BASE}/api/user/${id}`,
  updateUserSetting: (id) => `${API_BASE}/api/settings/${id}`,
};

function resolveProfileImage(raw, fallbackSessionImage) {
  let v = typeof raw === "string" ? raw.trim() : "";

  if (!v && typeof fallbackSessionImage === "string") {
    v = fallbackSessionImage.trim();
  }

  if (!v) return "/images/pfp.png";
  if (v.startsWith("data:image")) return v;
  if (v.startsWith("http://") || v.startsWith("https://")) return v;

  return `${API_BASE}${v}`;
}

export default function ProfileSettingsPage() {
  const { data: session, status, update } = useSession();

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  const userId = session?.user?.id || null;
  const apiToken = session?.apiToken || "";

  const [formData, setFormData] = useState({
    name: "",
    display_name: "",
    email: "",
    bio: "",
    location: "",
    website: "",
    phone: "",
    password: "",
    img: "",
  });

  const [initialFormData, setInitialFormData] = useState(null);

  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");

  const disableActions = useMemo(
    () => isLoading || isLoadingProfile || status !== "authenticated",
    [isLoading, isLoadingProfile, status]
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (formData.email.trim() && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const authFetch = async (url, init = {}) => {
    const headers = new Headers(init.headers || {});
    headers.set("Content-Type", "application/json");
    if (apiToken) headers.set("Authorization", `Bearer ${apiToken}`);

    const res = await fetch(url, {
      ...init,
      headers,
      cache: "no-store",
    });
    return res;
  };

  const fetchUserProfile = async (uid) => {
    if (!uid) return;

    setIsLoadingProfile(true);
    try {
      const res = await authFetch(ROUTES.getUser(uid), { method: "GET" });

      if (res.status === 401 || res.status === 403) {
        setErrors({
          general: "Unauthorized. Please sign in again.",
        });
        return;
      }

      if (!res.ok) {
        setErrors({
          general:
            res.status === 404 ? "User not found" : "Failed to load profile",
        });
        return;
      }

      const data = await res.json().catch(() => ({}));
      const u = data?.user || data || {};

      const description =
        [u?.user_bio, u?.bio, u?.description, u?.about].find(
          (v) => !!v && String(v).trim()
        ) || "";

      const website =
        (u?.website && String(u.website).trim()) ||
        (u?.web && String(u.web).trim()) ||
        "";

      const next = {
        name: u.full_name || "",
        display_name: u.user_name || "",
        email: u.email || "",
        bio: description,
        location: u.location || "",
        website,
        phone: u.phone || "",
        password: "",
        img: u.img || session?.user?.image || "",
      };

      setFormData(next);
      setInitialFormData(next);
    } catch (err) {
      console.error("fetchUserProfile error:", err);
      setErrors({ general: "Unable to reach server" });
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSuccessMessage("");
    setErrors({});

    if (!validateForm()) return;

    if (!userId) {
      setErrors({ general: "Missing userId (session)." });
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        full_name: formData.name,
        display_name: formData.display_name,
        email: formData.email, // จะ normalize ด้านล่าง
        bio: formData.bio,
        user_bio: formData.bio,
        description: formData.bio,
        location: formData.location,
        phone: formData.phone,
        website: formData.website,
        web: formData.website,
        img: formData.img,
      };

      // ถ้ามี password ค่อยส่งไป
      if (formData.password && formData.password.trim()) {
        payload.password = formData.password;
      }

      // === normalize email: กันเคส "" ไปชน unique constraint ===
      if (typeof payload.email === "string") {
        const trimmedEmail = payload.email.trim();
        if (!trimmedEmail) {
          // ไม่ส่ง field email ถ้าเป็นค่าว่าง → backend จะไม่อัปเดต email
          delete payload.email;
        } else {
          payload.email = trimmedEmail;
        }
      }

      const res = await authFetch(ROUTES.updateUserSetting(userId), {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 401 || res.status === 403) {
        setErrors({
          general:
            "Unauthorized. Your session may have expired—please sign in again.",
        });
        return;
      }

      if (!res.ok) {
        console.error("[settings] save failed", res.status, data);
        setErrors({
          general:
            data?.error ||
            (res.status === 409
              ? "Some of this information is already used by another account (for example, the email)."
              : "Failed to update profile. Please try again."),
        });
        return;
      }

      try {
        const u = data?.user || {};
        let rawImg = u.img || formData.img || session?.user?.image || "";

        if (typeof rawImg === "string" && rawImg.trim()) {
          rawImg = rawImg.trim();

          let finalUrl = rawImg;
          if (
            !finalUrl.startsWith("http://") &&
            !finalUrl.startsWith("https://") &&
            !finalUrl.startsWith("data:image")
          ) {
            finalUrl = `${API_BASE}${finalUrl}`;
          }

          await update({
            image: finalUrl,
            img: finalUrl,
          });
        }
      } catch (err) {
        console.warn("[settings] failed to update session image", err);
      }

      setSuccessMessage("Profile updated successfully!");
      setIsEditing(false);
      setFormData((prev) => ({ ...prev, password: "" }));
      setTimeout(() => setSuccessMessage(""), 3000);

      fetchUserProfile(userId);
    } catch (err) {
      console.error("handleSave error:", err);
      setErrors({
        general: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (initialFormData) {
      setFormData(initialFormData);
    }
    setErrors({});
    setIsEditing(false);
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const val = ev.target?.result;
      if (typeof val === "string") {
        console.log("New image saved (base64 length):", val.length);
        setFormData((prev) => ({ ...prev, img: val }));
      }
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (status === "authenticated" && userId) {
      fetchUserProfile(userId);
    }
    if (status === "unauthenticated") {
      setIsLoadingProfile(false);
    }
  }, [status, userId, apiToken]);

  const profileImageSrc = resolveProfileImage(
    formData.img,
    session?.user?.image
  );

  /* ========== UI STATE: Loading / Not logged in ========== */

  if (status === "loading" || isLoadingProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-cyan-50 to-sky-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-emerald-900/80">Loading profile…</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-cyan-50 to-sky-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-emerald-900 mb-3">
            You&apos;re not logged in
          </h1>
          <p className="text-emerald-800/70">
            หน้านี้ต้องล็อกอินก่อนถึงเข้าได้
          </p>
          <a
            href="/login"
            className="inline-flex items-center mt-6 px-6 py-3 text-white font-medium rounded-xl bg-gradient-to-r from-emerald-500 to-sky-500 shadow hover:opacity-90 transition"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  /* ========== MAIN LAYOUT ========== */

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-cyan-50 to-sky-50 pb-12">
      {/* Top banner */}
      <div className="h-40 sm:h-48 w-full bg-gradient-to-r from-emerald-200/60 via-cyan-200/50 to-sky-200/60" />

      <div className="-mt-16 sm:-mt-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header card */}
        <div className="rounded-2xl bg-white/80  border border-emerald-100 shadow-sm p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-sky-600">
                Profile Settings
              </h1>
              <p className="text-emerald-900/70 mt-1">
                Manage your account settings and preferences
              </p>
              <p className="text-xs text-emerald-900/60 mt-1">
                Logged in as{" "}
                <b>
                  {session?.user?.name || session?.user?.login_name || "—"}
                </b>
              </p>
            </div>
            <a
              href="/"
              className="inline-flex items-center px-4 py-2 text-sm font-semibold rounded-xl ring-1 ring-emerald-200 text-emerald-800 bg-white hover:bg-emerald-50 transition"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to Dashboard
            </a>
          </div>
        </div>

        {/* Alerts */}
        {successMessage && (
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900/90">
            {successMessage}
          </div>
        )}
        {errors.general && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
            {errors.general}
          </div>
        )}

        {/* Content grid */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ----- LEFT: Avatar + Actions ----- */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl bg-white/80  border border-emerald-100 shadow-sm p-6">
              <h2 className="text-xl font-semibold text-emerald-900 mb-6">
                Profile Picture
              </h2>
              <div className="text-center">
                <div className="relative inline-block">
                  <span className="p-[3px] bg-gradient-to-tr from-emerald-300 to-sky-300 rounded-full inline-block">
                    <img
                      src={profileImageSrc}
                      alt="Profile"
                      className="w-32 h-32 rounded-full object-cover ring-4 ring-white bg-white"
                    />
                  </span>

                  {isEditing && (
                    <label className="absolute bottom-1 right-1 bg-gradient-to-r from-emerald-500 to-sky-500 text-white rounded-full p-2 cursor-pointer shadow hover:opacity-90 transition">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* Display name + @login_name */}
                <h3 className="text-lg font-semibold text-emerald-900 mt-4">
                  {formData.display_name?.trim() || formData.name || "User"}
                </h3>
                <p className="text-emerald-900/70 text-sm">
                  @{session?.user?.login_name || session?.user?.name || ""}
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-white/80 border border-emerald-100 shadow-sm p-6 mt-6">
              <h2 className="text-xl font-semibold text-emerald-900 mb-4">
                Account Actions
              </h2>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    if (disableActions) return;
                    if (isEditing) {
                      handleCancel();
                    } else {
                      setInitialFormData(formData);
                      setIsEditing(true);
                    }
                  }}
                  className="w-full flex items-center justify-center px-4 py-2 text-white font-semibold rounded-xl bg-gradient-to-r from-emerald-500 to-sky-500 shadow hover:opacity-90 transition disabled:opacity-60"
                  disabled={disableActions}
                >
                  {isEditing ? "Cancel Editing" : "Edit Profile"}
                </button>

                <button
                  onClick={() => {
                    if (
                      window.confirm(
                        "Are you sure you want to log out from this device?"
                      )
                    ) {
                      signOut({ callbackUrl: "/" });
                    }
                  }}
                  className="w-full flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-xl border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 transition"
                >
                  Log Out
                </button>
              </div>
            </div>
          </div>

          {/* ----- RIGHT: Form ----- */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl bg-white/80 border border-emerald-100 shadow-sm p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-emerald-900">
                  Profile Information
                </h2>
                {!isEditing && (
                  <span className="text-sm text-emerald-900/60">
                    Click &quot;Edit Profile&quot; to make changes
                  </span>
                )}
              </div>

              <form onSubmit={handleSave} className="space-y-6">
                {/* Full Name */}
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-emerald-900/80 mb-2"
                  >
                    Full Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400 ${
                        errors.name
                          ? "border-red-300 bg-red-50"
                          : "border-emerald-200 focus:border-emerald-400"
                      }`}
                      placeholder="Enter your full name"
                    />
                  ) : (
                    <p className="text-emerald-950 py-3">
                      {formData.name || "Not provided"}
                    </p>
                  )}
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                {/* Display Name */}
                <div>
                  <label
                    htmlFor="display_name"
                    className="block text-sm font-medium text-emerald-900/80 mb-2"
                  >
                    Display Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      id="display_name"
                      name="display_name"
                      value={formData.display_name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-colors"
                      placeholder="How your name appears publicly"
                    />
                  ) : (
                    <p className="text-emerald-950 py-3">
                      {formData.display_name || "Not provided"}
                    </p>
                  )}
                </div>

                {/* Email (optional) */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-emerald-900/80 mb-2"
                  >
                    Email Address
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400 ${
                        errors.email
                          ? "border-red-300 bg-red-50"
                          : "border-emerald-200 focus:border-emerald-400"
                      }`}
                      placeholder="Enter your email address (optional)"
                    />
                  ) : (
                    <p className="text-emerald-950 py-3">
                      {formData.email || "Not provided"}
                    </p>
                  )}
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label
                    htmlFor="bio"
                    className="block text-sm font-medium text-emerald-900/80 mb-2"
                  >
                    Description
                  </label>
                  {isEditing ? (
                    <textarea
                      id="bio"
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl border border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-colors"
                      placeholder="Add a short description about yourself..."
                    />
                  ) : (
                    <p className="text-emerald-950 py-3">
                      {formData.bio || "No description provided"}
                    </p>
                  )}
                </div>

                {/* Location */}
                <div>
                  <label
                    htmlFor="location"
                    className="block text-sm font-medium text-emerald-900/80 mb-2"
                  >
                    Location
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-colors"
                      placeholder="Where are you located?"
                    />
                  ) : (
                    <p className="text-emerald-950 py-3">
                      {formData.location || "Not provided"}
                    </p>
                  )}
                </div>

                {/* Website */}
                <div>
                  <label
                    htmlFor="website"
                    className="block text-sm font-medium text-emerald-900/80 mb-2"
                  >
                    Website
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      id="website"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-colors"
                      placeholder="yourwebsite.com / link / text"
                    />
                  ) : (
                    <p className="py-3">
                      {formData.website ? (
                        /^https?:\/\//i.test(formData.website) ? (
                          <a
                            href={formData.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-700 hover:text-emerald-900 underline"
                          >
                            {formData.website}
                          </a>
                        ) : (
                          <span className="text-emerald-950">
                            {formData.website}
                          </span>
                        )
                      ) : (
                        <span className="text-emerald-950">Not provided</span>
                      )}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-emerald-900/80 mb-2"
                  >
                    Phone Number
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-colors"
                      placeholder="Your phone number"
                    />
                  ) : (
                    <p className="text-emerald-950 py-3">
                      {formData.phone || "Not provided"}
                    </p>
                  )}
                </div>

                {/* Password (optional) */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-emerald-900/80 mb-2"
                  >
                    Change Password (optional)
                  </label>
                  {isEditing ? (
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-colors"
                      placeholder="Leave blank to keep current password"
                    />
                  ) : (
                    <p className="text-emerald-950 py-3">••••••••</p>
                  )}
                </div>

                {/* Save / Cancel buttons */}
                {isEditing && (
                  <div className="flex flex-wrap gap-3 justify-end pt-2">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="px-4 py-2 rounded-xl border border-emerald-200 text-emerald-800 bg-white hover:bg-emerald-50 transition disabled:opacity-60"
                      disabled={disableActions}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-sky-500 text-white font-semibold shadow hover:opacity-90 transition disabled:opacity-60"
                      disabled={disableActions}
                    >
                      {isLoading ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

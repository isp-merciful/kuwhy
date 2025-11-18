"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession, signOut } from "next-auth/react";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

// ✅ FIXED: Correct route for user setting
const ROUTES = {
  getUser: (id) => `${API_BASE}/api/user/${id}`,
  updateUserSetting: (id) => `${API_BASE}/api/user/${id}/setting`,
};

export default function ProfileSettingsPage() {
  const { data: session, status } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  const userId = session?.user?.id || null;
  const apiToken = session?.apiToken || "";

  // 🔥 Added: image state
  const [profileImage, setProfileImage] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    display_name: "",
    email: "",
    bio: "",
    location: "",
    website: "",
    phone: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");

  const disableActions = useMemo(
    () => isLoading || isLoadingProfile || status !== "authenticated",
    [isLoading, isLoadingProfile, status]
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Please enter a valid email";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const authFetch = async (url, init = {}) => {
    const headers = new Headers(init.headers || {});
    headers.set("Content-Type", "application/json");
    if (apiToken) headers.set("Authorization", `Bearer ${apiToken}`);
    const res = await fetch(url, { ...init, headers, cache: "no-store" });
    return res;
  };

  const fetchUserProfile = async (uid) => {
    if (!uid) return;
    setIsLoadingProfile(true);
    try {
      const res = await authFetch(ROUTES.getUser(uid), { method: "GET" });

      if (res.status === 401 || res.status === 403) {
        setErrors({ general: "Unauthorized. Please sign in again." });
        return;
      }
      if (!res.ok) {
        setErrors({
          general: res.status === 404 ? "User not found" : "Failed to load profile",
        });
        return;
      }

      const data = await res.json().catch(() => ({}));
      const u = data?.user || data || {};

      // 🔥 Load profile image from DB
      setProfileImage(u.img || null);

      setFormData({
        name: u.full_name || "",
        display_name: u.user_name || "",
        email: u.email || "",
        bio: u.bio || "",
        location: u.location || "",
        website: u.web || "",
        phone: u.phone || "",
        password: "",
      });
    } catch {
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
        email: formData.email,
        bio: formData.bio,
        location: formData.location,
        phone: formData.phone,
        website: formData.website,
        // 🔥 include image
        img: profileImage,
      };

      const res = await authFetch(ROUTES.updateUserSetting(userId), {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErrors({
          general: data?.error || "Failed to update profile. Please try again.",
        });
        return;
      }

      setSuccessMessage("Profile updated successfully!");
      setIsEditing(false);
      setFormData((prev) => ({ ...prev, password: "" }));
      setTimeout(() => setSuccessMessage(""), 3000);

      // refresh UI
      fetchUserProfile(userId);
    } catch {
      setErrors({ general: "An unexpected error occurred. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (userId) fetchUserProfile(userId);
    setErrors({});
    setIsEditing(false);
  };

  // 🔥 handle uploading file preview and saving base64
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();

    reader.onload = (ev) => {
      const base64 = ev.target?.result;
      setProfileImage(base64);
      console.log("New image saved (base64 length):", base64.length);
    };

    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (status === "authenticated" && userId) fetchUserProfile(userId);
    if (status === "unauthenticated") setIsLoadingProfile(false);
  }, [status, userId, apiToken]);

  if (status === "loading" || isLoadingProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-cyan-50 to-sky-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-emerald-900/80">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-cyan-50 to-sky-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-emerald-900 mb-3">
            You're not logged in
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-cyan-50 to-sky-50 pb-12">
      <div className="h-40 sm:h-48 w-full bg-gradient-to-r from-emerald-200/60 via-cyan-200/50 to-sky-200/60" />
      <div className="-mt-16 sm:-mt-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-white/80 backdrop-blur-sm border border-emerald-100 shadow-sm p-6 sm:p-8">
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
                <b>{session?.user?.name || session?.user?.login_name || "—"}</b>
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

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl bg-white/80 backdrop-blur-sm border border-emerald-100 shadow-sm p-6">
              <h2 className="text-xl font-semibold text-emerald-900 mb-6">
                Profile Picture
              </h2>
              <div className="text-center">
                <div className="relative inline-block">
                  <span className="p-[3px] bg-gradient-to-tr from-emerald-300 to-sky-300 rounded-full inline-block">
                    <img
                      src={
                        profileImage ||
                        formData.img ||
                        "/images/pfp.png"
                      }
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

                <h3 className="text-lg font-semibold text-emerald-900 mt-4">
                  {formData.display_name?.trim() ||
                    formData.name ||
                    "User"}
                </h3>
                <p className="text-emerald-900/70">{formData.email || "-"}</p>
              </div>
            </div>

            <div className="rounded-2xl bg-white/80 backdrop-blur-sm border border-emerald-100 shadow-sm p-6 mt-6">
              <h2 className="text-xl font-semibold text-emerald-900 mb-4">
                Account Actions
              </h2>
              <div className="space-y-3">
                <button
                  onClick={() => setIsEditing((v) => !v)}
                  className="w-full flex items-center justify-center px-4 py-2 text-white font-semibold rounded-xl bg-gradient-to-r from-emerald-500 to-sky-500 shadow hover:opacity-90 transition"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  {isEditing ? "Cancel Editing" : "Edit Profile"}
                </button>

                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="w-full flex items-center justify-center px-4 py-2 font-semibold rounded-xl ring-1 ring-emerald-200 text-emerald-800 bg-white hover:bg-emerald-50 transition"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  Sign Out
                </button>
              </div>
            </div>
          </div>

          {/* Right Column — Form */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl bg-white/80 backdrop-blur-sm border border-emerald-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-emerald-900">
                  Profile Information
                </h2>
                {!isEditing && (
                  <span className="text-sm text-emerald-900/60">
                    Click "Edit Profile" to make changes
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

                {/* Email */}
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
                      placeholder="Enter your email address"
                    />
                  ) : (
                    <p className="text-emerald-950 py-3">
                      {formData.email || "Not provided"}
                    </p>
                  )}
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                {/* Bio */}
                <div>
                  <label
                    htmlFor="bio"
                    className="block text-sm font-medium text-emerald-900/80 mb-2"
                  >
                    Bio
                  </label>
                  {isEditing ? (
                    <textarea
                      id="bio"
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl border border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-colors"
                      placeholder="Tell us about yourself..."
                    />
                  ) : (
                    <p className="text-emerald-950 py-3">
                      {formData.bio || "No bio provided"}
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

                {/* Password */}
                {isEditing && (
                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-emerald-900/80 mb-2"
                    >
                      New Password (optional)
                    </label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-colors"
                      placeholder="Leave blank to keep current password"
                    />
                    <p className="mt-1 text-sm text-emerald-900/60">
                      Leave blank to keep your current password
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                {isEditing && (
                  <div className="flex flex-col sm:flex-row gap-4 pt-6">
                    <button
                      type="submit"
                      disabled={disableActions}
                      className="flex-1 flex items-center justify-center px-6 py-3 text-white font-semibold rounded-xl bg-gradient-to-r from-emerald-500 to-sky-500 shadow disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition"
                    >
                      {isLoading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-5 h-5 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          Save Changes
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={disableActions}
                      className="flex-1 flex items-center justify-center px-6 py-3 font-semibold rounded-xl ring-1 ring-emerald-200 text-emerald-800 bg-white hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                      Cancel
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
          {/* END Right Column */}
        </div>
      </div>
    </div>
  );
}

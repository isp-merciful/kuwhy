'use client';

import { useEffect, useMemo, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
const ROUTES = {
  getUser: (id) => `http://localhost:8000/api/user/${id}`,
  updateUserSetting: (id) => `http://localhost:8000/api/settings/${id}`,
};

export default function ProfilePage() {
  const [mounted, setMounted] = useState(false);
  const [userId, setUserId] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  const [formData, setFormData] = useState({
    name: "",          // full_name
    display_name: "",  // ✅ user_name
    email: "",
    bio: "",
    location: "",
    website: "",       // web (optional, no regex)
    phone: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");

  const disableActions = useMemo(() => isLoading || isLoadingProfile, [isLoading, isLoadingProfile]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // ✅ ไม่บังคับ website เป็น URL แล้ว
  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Please enter a valid email";
    // ไม่ตรวจ website เป็น URL อีกต่อไป
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const fetchUserProfile = async (uid) => {
    if (!uid) return;
    setIsLoadingProfile(true);
    try {
      const res = await fetch(ROUTES.getUser(uid), { cache: "no-store" });
      if (!res.ok) {
        setErrors({ general: res.status === 404 ? "User not found" : "Failed to load profile" });
        return;
      }
      const data = await res.json().catch(() => ({}));
      const u = data?.user || data || {};

      setFormData({
        name: u.full_name || "",
        display_name: u.user_name || "", // ✅ map จาก DB -> form
        email: u.email || "",
        bio: u.bio || "",
        location: u.location || "",
        website: u.web || "",
        phone: u.phone || "",
        password: "",
      });

      if (u.user_id && u.user_id !== uid) {
        setUserId(u.user_id);
        try { localStorage.setItem("userId", u.user_id); } catch {}
      }
    } catch (e) {
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
    if (!userId) { setErrors({ general: "Missing userId (localStorage)." }); return; }

    setIsLoading(true);
    try {
      const payload = {
        full_name: formData.name,
        display_name: formData.display_name, // ✅ ส่งขึ้น API
        email: formData.email,
        bio: formData.bio,
        location: formData.location,
        phone: formData.phone,
        web: formData.website,               // ✅ ไม่เช็ค URL แล้ว
      };

      const res = await fetch(ROUTES.updateUserSetting(userId), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrors({ general: data?.error || "Failed to update profile. Please try again." });
        return;
      }

      setSuccessMessage("Profile updated successfully!");
      setIsEditing(false);
      setFormData((prev) => ({ ...prev, password: "" }));
      setTimeout(() => setSuccessMessage(""), 3000);
      fetchUserProfile(userId);
    } catch (err) {
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

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { console.log("New profile image (preview only):", ev.target?.result); };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    setMounted(true);
    try {
      let uid = localStorage.getItem("userId");
      if (uid) uid = uid.replace(/"/g, "").trim();
      setUserId(uid || null);
      if (uid) fetchUserProfile(uid);
      else setIsLoadingProfile(false);
    } catch {
      setIsLoadingProfile(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!mounted || isLoadingProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-3">No User ID</h1>
          <p className="text-gray-600">
            ไม่พบ <code>userId</code> ใน <code>localStorage</code>. โปรดเข้าสู่ระบบหรือสร้างผู้ใช้ให้เรียบร้อยก่อน
          </p>
          <a href="/login" className="inline-flex items-center mt-6 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
              <p className="text-gray-600 mt-2">Manage your account settings and preferences</p>
            </div>
            <a href="/" className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </a>
          </div>
        </div>

        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800">{successMessage}</p>
          </div>
        )}
        {errors.general && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{errors.general}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* left */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Picture</h2>
              <div className="text-center">
                <div className="relative inline-block">
                  <img src={"/images/pfp.png"} alt="Profile" className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg" />
                  {isEditing && (
                    <label className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-2 cursor-pointer hover:bg-blue-700 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                    </label>
                  )}
                </div>

                <h3 className="text-lg font-medium text-gray-900 mt-4">
                  {/* แสดง display_name ถ้ามี ไม่งั้น fallback เป็น full_name */}
                  {formData.display_name?.trim() || formData.name || "User"}
                </h3>
                <p className="text-gray-600">{formData.email || "-"}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 mt-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Actions</h2>
              <div className="space-y-3">
                <button
                  onClick={() => setIsEditing((v) => !v)}
                  className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  {isEditing ? "Cancel Editing" : "Edit Profile"}
                </button>

                <button
                  onClick={() => { try { localStorage.removeItem("userId"); } catch {} window.location.href = "/login"; }}
                  className="w-full flex items-center justify-center px-4 py-2 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign Out
                </button>
              </div>
            </div>
          </div>

          {/* right form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
                {!isEditing && <span className="text-sm text-gray-500">Click "Edit Profile" to make changes</span>}
              </div>

              <form onSubmit={handleSave} className="space-y-6">
                {/* Full Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  {isEditing ? (
                    <input
                      type="text" id="name" name="name" value={formData.name} onChange={handleInputChange}
                      className={`w-full px-4 py-3 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.name ? "border-red-300 bg-red-50" : "border-gray-300 focus:border-blue-500"
                      }`} placeholder="Enter your full name"
                    />
                  ) : (
                    <p className="text-gray-900 py-3">{formData.name || "Not provided"}</p>
                  )}
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>

                {/* Display Name (user_name) */}
                <div>
                  <label htmlFor="display_name" className="block text-sm font-medium text-gray-700 mb-2">Display Name</label>
                  {isEditing ? (
                    <input
                      type="text" id="display_name" name="display_name" value={formData.display_name} onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="How your name appears publicly"
                    />
                  ) : (
                    <p className="text-gray-900 py-3">{formData.display_name || "Not provided"}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  {isEditing ? (
                    <input
                      type="email" id="email" name="email" value={formData.email} onChange={handleInputChange}
                      className={`w-full px-4 py-3 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.email ? "border-red-300 bg-red-50" : "border-gray-300 focus:border-blue-500"
                      }`} placeholder="Enter your email address"
                    />
                  ) : (
                    <p className="text-gray-900 py-3">{formData.email || "Not provided"}</p>
                  )}
                  {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                </div>

                {/* Bio */}
                <div>
                  <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                  {isEditing ? (
                    <textarea
                      id="bio" name="bio" value={formData.bio} onChange={handleInputChange} rows={4}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Tell us about yourself..."
                    />
                  ) : (
                    <p className="text-gray-900 py-3">{formData.bio || "No bio provided"}</p>
                  )}
                </div>

                {/* Location */}
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  {isEditing ? (
                    <input
                      type="text" id="location" name="location" value={formData.location} onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Where are you located?"
                    />
                  ) : (
                    <p className="text-gray-900 py-3">{formData.location || "Not provided"}</p>
                  )}
                </div>

                {/* Website (no URL validation) */}
                <div>
                  <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                  {isEditing ? (
                    <input
                      type="text" id="website" name="website" value={formData.website} onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="yourwebsite.com / link / text"
                    />
                  ) : (
                    <p className="text-gray-900 py-3">
                      {formData.website ? (
                        // แสดงเป็นลิงก์ก็ต่อเมื่อเริ่มด้วย http(s)
                        /^https?:\/\//i.test(formData.website)
                          ? <a href={formData.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{formData.website}</a>
                          : formData.website
                      ) : "Not provided"}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  {isEditing ? (
                    <input
                      type="tel" id="phone" name="phone" value={formData.phone} onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Your phone number"
                    />
                  ) : (
                    <p className="text-gray-900 py-3">{formData.phone || "Not provided"}</p>
                  )}
                </div>

                {/* Password (UI only) */}
                {isEditing && (
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">New Password (optional)</label>
                    <input
                      type="password" id="password" name="password" value={formData.password} onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Leave blank to keep current password"
                    />
                    <p className="mt-1 text-sm text-gray-500">Leave blank to keep your current password</p>
                  </div>
                )}

                {/* Actions */}
                {isEditing && (
                  <div className="flex flex-col sm:flex-row gap-4 pt-6 border-top border-gray-200">
                    <button type="submit" disabled={disableActions}
                      className="flex-1 flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                      {isLoading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Save Changes
                        </>
                      )}
                    </button>

                    <button type="button" onClick={handleCancel} disabled={disableActions}
                      className="flex-1 flex items-center justify-center px-6 py-3 bg-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Cancel
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

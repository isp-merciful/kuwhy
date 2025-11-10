'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const ERROR_TEXT = {
  CredentialsSignin: 'Invalid username or password.',
  OAuthSignin: 'Could not sign you in. Please try again.',
  OAuthCallback: 'Authentication failed. Please try again.',
  OAuthAccountNotLinked: 'Account already exists with a different sign-in method.',
  default: 'Something went wrong. Please try again.',
};

export default function LoginPage() {
  const { data: session } = useSession();
  const router = useRouter();

  // ----- state -----
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'

  const [formData, setFormData] = useState({
    login_name: '',
    user_name: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [authError, setAuthError] = useState('');

  // ----- effects -----
  useEffect(() => {
    setMounted(true);

    // อ่าน ?error=... แบบไม่ใช้ useSearchParams (กัน hook-order issues)
    try {
      const usp = new URLSearchParams(window.location.search);
      const errKey = usp.get('error') || '';
      if (errKey) setAuthError(ERROR_TEXT[errKey] || ERROR_TEXT.default);
    } catch {}
  }, []);

  useEffect(() => {
    if (session?.user?.id) {
      try {
        const usp = new URLSearchParams(window.location.search);
        const cb = usp.get('callbackUrl') || '/';
        router.replace(cb);
      } catch {
        router.replace('/');
      }
    }
  }, [session, router]);

  if (!mounted) return null;

  // ----- handlers -----
  const switchAuthMode = (mode) => {
    setAuthMode(mode);
    setFormData({ login_name: '', user_name: '', password: '' });
    setErrors({});
    setAuthError('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: '' }));
  };

  const validateForm = () => {
    const newErr = {};
    if (!formData.login_name.trim()) newErr.login_name = 'login_name is required';
    if (!formData.password.trim()) newErr.password = 'Password is required';
    else if (formData.password.length < 6) newErr.password = 'Password must be at least 6 characters';
    if (authMode === 'register' && !formData.user_name.trim()) newErr.user_name = 'Display name is required';
    setErrors(newErr);
    return Object.keys(newErr).length === 0;
  };

  const handleCredentialAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      let callbackUrl = '/';
      try {
        const usp = new URLSearchParams(window.location.search);
        callbackUrl = usp.get('callbackUrl') || '/';
      } catch {}

      const res = await signIn('credentials', {
        redirect: false,
        login_name: formData.login_name,
        user_name: authMode === 'register' ? formData.user_name : '',
        password: formData.password,
        isRegister: authMode === 'register' ? 'true' : 'false',
        callbackUrl,
      });

      if (res?.error) {
        setFormData((p) => ({ ...p, password: '' })); // คง username ล้างรหัส
        setAuthError(ERROR_TEXT[res.error] || ERROR_TEXT.default);
        setIsLoading(false);
        return;
      }

      router.replace(res?.url || callbackUrl);
    } catch {
      setAuthError('An unexpected error occurred.');
      setIsLoading(false);
    }
  };

  const handleGoogle = async () => {
    setAuthError('');
    setIsLoading(true);
    let callbackUrl = '/';
    try {
      const usp = new URLSearchParams(window.location.search);
      callbackUrl = usp.get('callbackUrl') || '/';
    } catch {}
    await signIn('google', { callbackUrl });
    setIsLoading(false);
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    await signOut({ redirect: false });
    setIsLoading(false);
  };

  // ----- render -----
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-[#f2fbf6] to-[#eef6ff]">
      <main className="mx-auto flex max-w-6xl justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="rounded-3xl border bg-white shadow-xl">
            <div className="p-6 sm:p-8">
              {!session ? (
                <>
                  {/* Header */}
                  <div className="text-center">
                    <h2 className="text-base font-medium text-gray-700">Welcome to</h2>
                    <div className="mb-5 text-2xl font-extrabold text-green-600">KU WHY</div>

                    {/* Tabs */}
                    <div className="mx-auto mb-6 flex w-full max-w-xs rounded-full bg-gray-100 p-1">
                      <button
                        type="button"
                        onClick={() => switchAuthMode('login')}
                        className={`flex-1 rounded-full py-2 text-sm font-medium ${
                          authMode === 'login' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        Sign in
                      </button>
                      <button
                        type="button"
                        onClick={() => switchAuthMode('register')}
                        className={`flex-1 rounded-full py-2 text-sm font-medium ${
                          authMode === 'register' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        Sign up
                      </button>
                    </div>
                  </div>

                  {authError ? (
                    <div
                      className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600"
                      role="alert"
                      aria-live="polite"
                    >
                      {authError}
                    </div>
                  ) : null}

                  {/* Form */}
                  <form onSubmit={handleCredentialAuth} className="space-y-4">
                    {/* login_name */}
                    <div>
                      <label htmlFor="login_name" className="mb-1 block text-sm text-gray-700">
                        Username
                      </label>
                      <input
                        id="login_name"
                        name="login_name"
                        value={formData.login_name}
                        onChange={handleInputChange}
                        placeholder="Enter your Username"
                        className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${
                          errors.login_name ? 'border-red-300 bg-red-50' : 'border-gray-200'
                        }`}
                        autoComplete="username"
                      />
                      {errors.login_name && <p className="mt-1 text-xs text-red-600">{errors.login_name}</p>}
                    </div>

                    {/* user_name (เฉพาะสมัคร) */}
                    {authMode === 'register' && (
                      <div>
                        <label htmlFor="user_name" className="mb-1 block text-sm text-gray-700">
                          Display name
                        </label>
                        <input
                          id="user_name"
                          name="user_name"
                          value={formData.user_name}
                          onChange={handleInputChange}
                          placeholder="Enter your Display name"
                          className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${
                            errors.user_name ? 'border-red-300 bg-red-50' : 'border-gray-200'
                          }`}
                        />
                        {errors.user_name && <p className="mt-1 text-xs text-red-600">{errors.user_name}</p>}
                      </div>
                    )}

                    {/* Password */}
                    <div>
                      <label htmlFor="password" className="mb-1 block text-sm text-gray-700">
                        Password
                      </label>
                      <input
                        id="password"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="Enter your password"
                        className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${
                          errors.password ? 'border-red-300 bg-red-50' : 'border-gray-200'
                        }`}
                        autoComplete="current-password"
                      />
                      {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-green-600 py-2.5 text-sm font-medium text-white shadow hover:from-blue-700 hover:to-green-700 disabled:opacity-50"
                    >
                      {isLoading
                        ? authMode === 'register'
                          ? 'Creating account…'
                          : 'Signing in…'
                        : authMode === 'register'
                        ? 'Sign up'
                        : 'Sign in'}
                    </button>
                  </form>

                  {/* Divider */}
                  <div className="my-6 flex items-center">
                    <div className="h-px flex-1 bg-gray-200" />
                    <span className="px-3 text-xs text-gray-500">Or continue with</span>
                    <div className="h-px flex-1 bg-gray-200" />
                  </div>

                  {/* Google Button */}
                  <button
                    onClick={handleGoogle}
                    disabled={isLoading}
                    className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-200 bg-white py-3 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700" />
                    ) : (
                      <>
                        <img src="/images/google-icon.svg" alt="Google" className="h-5 w-5" />
                        Continue with Google
                      </>
                    )}
                  </button>

                  <p className="mt-6 text-center text-xs text-gray-500">
                    By signing in, you agree to our terms of service and privacy policy
                  </p>
                </>
              ) : (
                /* Logged-in card */
                <div className="text-center">
                  <h3 className="mb-2 text-sm text-gray-500">Welcome back</h3>
                  <img
                    src={session.user?.image || '/images/logo.png'}
                    alt={session.user?.name || 'User'}
                    className="mx-auto mb-3 h-20 w-20 rounded-full border object-cover"
                  />
                  <div className="text-lg font-semibold">{session.user?.name ?? 'User'}</div>
                  {session.user?.email && <div className="text-sm text-gray-500">{session.user.email}</div>}

                  <div className="mt-6 space-y-3">
                    <button
                      onClick={() => router.replace('/')}
                      className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-green-600 py-2.5 text-sm font-medium text-white shadow hover:from-blue-700 hover:to-green-700"
                    >
                      Go to Dashboard
                    </button>
                    <button
                      onClick={handleSignOut}
                      disabled={isLoading}
                      className="w-full rounded-lg border bg-white py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      {isLoading ? 'Signing out…' : 'Sign out'}
                    </button>
                  </div>
                </div>
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

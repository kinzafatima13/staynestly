"use client";
import { useState, useEffect } from 'react';
import { loginEmailPassword } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { user, role, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Redirect to dashboard or home if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      if (role === 'host') {
        router.push('/dashboard');
      } else {
        router.push('/');
      }
    }
  }, [user, role, authLoading, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await loginEmailPassword(email, password);
      // Don't redirect here - let the useEffect handle it after auth state updates
      // This ensures the AuthContext has fully processed the login
    } catch (err: any) {
      setError('Invalid email or password. Please try again.');
      setLoading(false);
    }
    // Don't set loading to false on success - keep showing loading state until redirect
  }

  // Show loading if auth is still initializing or if user is already logged in (redirecting)
  if (authLoading || user) {
    return (
      <main className="min-h-screen grid place-items-center bg-gray-50 px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-500">{user ? 'Redirecting...' : 'Loading...'}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen grid place-items-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-3xl shadow-xl p-8 transition-shadow duration-300 hover:shadow-2xl">

        {/* Header and Logo */}
        <div className="mb-8 text-center space-y-2">
          <div className="inline-flex items-center gap-2">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-white text-xl font-extrabold tracking-tight">
              SN
            </span>
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
              StayNestly
            </span>
          </div>
          <h1 className="text-3xl font-bold pt-2 text-slate-800">Welcome Back</h1>
          <p className="text-sm text-slate-500">Sign in to manage your stays and properties.</p>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 p-3 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors duration-200"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 p-3 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors duration-200"
              required
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm font-medium">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-xl text-white font-semibold transition-all duration-200 ${loading
              ? 'bg-primary/70 cursor-not-allowed'
              : 'bg-primary hover:bg-orange-600 focus:outline-none focus:ring-4 focus:ring-primary/50'
              }`}
          >
            {loading ? 'Authenticating...' : 'Login'}
          </button>
        </form>

        {/* Footer Link */}
        <p className="text-sm text-center text-slate-500 mt-6">
          Don't have an account?
          <Link href="/auth/signup" className="text-primary hover:text-orange-600 font-medium ml-1 transition-colors duration-200">
            Sign up here
          </Link>
        </p>
      </div>
    </main>
  );
}
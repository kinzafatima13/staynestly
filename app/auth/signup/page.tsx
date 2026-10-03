"use client";
import React, { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Upload, User, CheckCircle, Loader2 } from 'lucide-react';
import { signupEmailPassword } from '@/lib/auth';
import { useAuth } from '@/context/AuthContext';

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, role, loading: authLoading } = useAuth();
  const defaultRole = searchParams.get('role') || 'guest';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: defaultRole as 'guest' | 'host'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string>("");

  // Redirect to dashboard/home if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      if (role === 'host') {
        router.push('/dashboard');
      } else {
        router.push('/');
      }
    }
  }, [user, role, authLoading, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signupEmailPassword(
        formData.name,
        formData.email,
        formData.password,
        formData.role
      );
      // Don't redirect here - let the useEffect handle it after auth state updates
      // This ensures the AuthContext has fully processed the signup
    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err.message || 'Failed to create account. Please try again.');
      setLoading(false);
    }
    // Don't set loading to false on success - keep showing loading state until redirect
  };

  // Show loading if auth is still initializing or if user is already logged in (redirecting)
  if (authLoading || user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-500">{user ? 'Redirecting...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-slate-800">Create Account</h1>
          <p className="text-slate-500 mt-2">Join us to book stays or list your home.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* --- PHOTO UPLOAD SECTION --- */}
          <div className="flex flex-col items-center justify-center mb-6">
            <div className="relative w-24 h-24 mb-3">
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="w-full h-full rounded-full object-cover border-4 border-orange-100 shadow-md"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300">
                  <User className="w-8 h-8 text-gray-400" />
                </div>
              )}

              <label
                htmlFor="photo-upload"
                className="absolute bottom-0 right-0 bg-orange-600 text-white p-2 rounded-full cursor-pointer hover:bg-orange-700 shadow-lg transition"
              >
                <Upload className="w-4 h-4" />
              </label>
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
              />
            </div>
            <p className="text-xs text-slate-400">Upload Profile Picture</p>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Full Name</label>
            <input
              required
              name="name"
              placeholder="Muhammad Zain"
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Email Address</label>
            <input
              required
              type="email"
              name="email"
              placeholder="zain@example.com"
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Password</label>
            <input
              required
              type="password"
              name="password"
              placeholder="••••••••"
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">I want to be a:</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 bg-white"
            >
              <option value="guest">Guest (I want to book)</option>
              <option value="host">Host (I want to list property)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition shadow-lg mt-4 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating Account...
              </>
            ) : (
              <>
                Sign Up <CheckCircle className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/auth/login" className="text-slate-400 hover:text-slate-600 text-sm">Already have an account? Login</Link>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <SignupForm />
    </Suspense>
  );
}
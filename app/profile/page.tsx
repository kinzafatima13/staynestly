"use client";
import React, { useEffect, useState } from 'react';
import { User, Mail, LogOut, Camera, Home, Settings, Shield, Loader2, Star, MessageCircle } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { logout } from '@/lib/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import ConfirmationModal from '@/components/ConfirmationModal';

interface UserData {
  uid?: string; // Add uid to track profile ownership
  name: string;
  email: string;
  role: string;
  photo?: string;
  joined: string;
  phone?: string;
  bio?: string;
  gender?: string;
  age?: string;
  location?: string;
  interests?: string[];
  rating?: number;
  reviews?: number;
  whatsappNumber?: string; // Add whatsapp number
}


function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetUserId = searchParams.get('userId');

  const { user, role, loading: authLoading } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Determine if we are viewing our own profile
  const isOwnProfile = !targetUserId || (user && user.uid === targetUserId);

  useEffect(() => {
    const loadUser = async () => {
      // If authenticating (and not viewing public profile), wait
      if (authLoading && !targetUserId) return;

      // If no target params and no auth user, redirect to login
      if (!targetUserId && !user && !authLoading) {
        router.push('/auth/login');
        return;
      }

      setLoading(true);
      const userIdArgs = targetUserId || user?.uid;

      if (!userIdArgs) {
        setLoading(false);
        return;
      }

      try {
        // Fetch user data from Firestore
        const userDoc = await getDoc(doc(db, 'users', userIdArgs));

        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData({
            uid: userIdArgs,
            name: data.name || (isOwnProfile ? user?.displayName : 'User') || 'User',
            email: data.email || (isOwnProfile ? user?.email : '') || '',
            role: data.role || (isOwnProfile ? role : 'guest') || 'guest',
            photo: data.photoURL || (isOwnProfile ? user?.photoURL : '') || '',
            joined: data.createdAt?.toDate ? data.createdAt.toDate().toLocaleDateString() : 'Recently',
            phone: data.phone || '',
            whatsappNumber: data.whatsappNumber || '',
            bio: data.bio || (isOwnProfile ? 'Welcome to my profile!' : 'No bio available.'),
            gender: data.gender || '',
            age: data.age || '',
            location: data.location || '',
            interests: data.interests || [],
            rating: data.rating || 4.5,
            reviews: data.reviews || 0
          });
        } else {
          if (isOwnProfile && user) {
            // Fallback to auth data for own profile
            setUserData({
              uid: user.uid,
              name: user.displayName || 'User',
              email: user.email || '',
              role: role || 'guest',
              photo: user.photoURL || '',
              joined: 'Recently',
              bio: 'Welcome to my profile!',
              interests: [],
              rating: 4.5,
              reviews: 0
            });
          } else {
            // Profile not found
            setUserData(null);
          }
        }
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [user, role, authLoading, router, targetUserId, isOwnProfile]);

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      setUploading(true);
      // TODO: Implement photo upload to Firebase Storage
      console.log('Photo upload feature coming soon!');
      alert('Photo upload feature will be implemented soon!');
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'host':
        return 'bg-purple-100 text-purple-700';
      case 'admin':
        return 'bg-red-100 text-red-700';
      case 'guest':
      default:
        return 'bg-orange-100 text-orange-700';
    }
  };

  const handleWhatsAppContact = () => {
    if (userData?.whatsappNumber || userData?.phone) {
      const number = userData.whatsappNumber || userData.phone;
      const url = `https://wa.me/${number}`;
      window.open(url, '_blank');
    } else {
      alert("No contact number available.");
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </main>
    );
  }

  if (!userData) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">User not found or profile is private.</p>
          <Link href="/" className="mt-4 inline-block text-orange-600 hover:text-orange-700">
            Return Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{isOwnProfile ? 'My Profile' : `${userData.name}'s Profile`}</h1>
            <p className="text-gray-500 mt-1">{isOwnProfile ? 'Manage your account and preferences' : `Member since ${userData.joined}`}</p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-orange-600 transition-colors"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column: Profile Card */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
              <div className="p-8">
                <div className="flex flex-col md:flex-row items-center gap-8">

                  {/* Profile Photo */}
                  <div className="relative shrink-0">
                    <div className="relative w-40 h-40 rounded-full overflow-hidden border-4 border-white shadow-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      {userData.photo ? (
                        <img
                          src={userData.photo}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-20 h-20 text-gray-400" />
                      )}
                    </div>

                    {isOwnProfile && (
                      <label
                        htmlFor="profile-upload"
                        className={`absolute bottom-2 right-2 bg-orange-600 text-white p-2.5 rounded-full cursor-pointer hover:bg-orange-700 shadow-lg transition-all transform hover:scale-105 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title="Change photo"
                      >
                        {uploading ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <Camera className="w-5 h-5" />
                        )}
                      </label>
                    )}
                    <input
                      id="profile-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoUpload}
                      disabled={uploading || !isOwnProfile}
                    />
                  </div>

                  {/* Profile Info */}
                  <div className="flex-1 text-center md:text-left space-y-4">
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900">{userData.name}</h2>
                      <div className="flex items-center justify-center md:justify-start gap-2 text-gray-600 mt-2">
                        {/* Only show email if it's own profile, or maybe masked for privacy? keeping it consistent with current reqs */}
                        {isOwnProfile && (
                          <>
                            <Mail className="w-4 h-4" />
                            <span className="font-medium">{userData.email}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                      <span className={`px-4 py-2 ${getRoleColor(userData.role)} rounded-full font-bold text-sm uppercase tracking-wider`}>
                        {userData.role}
                      </span>
                      <span className="px-3 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                        <Shield className="w-3 h-3 inline mr-1" />
                        Verified
                      </span>
                    </div>

                    {userData.bio && (
                      <div className="pt-4 border-t border-gray-100">
                        <p className="text-gray-600 italic">"{userData.bio}"</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="bg-gray-50 px-8 py-6 border-t border-gray-200">
                {/* Rating Display */}
                {userData.rating !== undefined && (
                  <div className="flex items-center gap-4 mb-6 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <Star className="w-6 h-6 text-yellow-500 fill-current" />
                      <span className="text-2xl font-bold text-gray-900">{userData.rating.toFixed(1)}</span>
                    </div>
                    <div className="text-gray-600">
                      <span className="font-medium">{userData.reviews || 0} reviews</span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-sm text-gray-500">Member Since</p>
                    <p className="font-semibold text-gray-900">{userData.joined}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Account Type</p>
                    <p className="font-semibold text-gray-900">{userData.role}</p>
                  </div>
                  {userData.gender && (
                    <div>
                      <p className="text-sm text-gray-500">Gender</p>
                      <p className="font-semibold text-gray-900">{userData.gender}</p>
                    </div>
                  )}
                  {/* Show phone if available effectively */}
                  {(userData.phone || userData.whatsappNumber) && isOwnProfile && (
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-semibold text-gray-900">{userData.phone || userData.whatsappNumber}</p>
                    </div>
                  )}

                </div>

                {/* Interests Display */}
                {userData.interests && userData.interests.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-500 mb-3">Interests</p>
                    <div className="flex flex-wrap gap-2">
                      {userData.interests.map((interest, idx) => (
                        <span key={idx} className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Actions */}
        <div className="space-y-6">
          {/* Actions differ for own profile vs viewing others */}

          {isOwnProfile ? (
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <Settings className="w-5 h-5 text-orange-600" />
                <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
              </div>

              <div className="space-y-3">
                {userData.role.toLowerCase() === 'host' && (
                  <Link
                    href="/dashboard"
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all shadow-md hover:shadow-lg"
                  >
                    <span className="font-semibold">Go to Dashboard</span>
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                )}

                <Link
                  href="/hotels"
                  className="flex items-center justify-between p-4 border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors group"
                >
                  <span className="font-medium text-gray-700 group-hover:text-orange-600">
                    Browse Hotels
                  </span>
                  <Home className="w-4 h-4 text-gray-400 group-hover:text-orange-600" />
                </Link>

                <Link
                  href="/bookings"
                  className="flex items-center justify-between p-4 border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors group"
                >
                  <span className="font-medium text-gray-700 group-hover:text-orange-600">
                    My Bookings
                  </span>
                  <svg className="w-4 h-4 text-gray-400 group-hover:text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </Link>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogoutClick}
                className="w-full mt-8 p-4 hover:bg-red-50 text-red-600 rounded-xl transition-colors border border-red-100 hover:border-red-200 flex items-center justify-center gap-3 font-semibold group"
              >
                <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                Sign Out
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <MessageCircle className="w-5 h-5 text-orange-600" />
                <h2 className="text-xl font-bold text-gray-900">Connect</h2>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Interested in becoming roommates or traveling together?
                </p>
                <button
                  onClick={handleWhatsAppContact}
                  className="w-full py-3 px-4 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  Chat on WhatsApp
                </button>
                {/* Add more public actions like 'Add Friend' if needed */}
              </div>
            </div>
          )}

          {/* Quick Stats / Complete Profile (Only for own profile) */}
          {isOwnProfile && (
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 border border-orange-200 mt-6 md:mt-0">
              <h3 className="font-bold text-gray-900 mb-4">Profile Stats</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Profile Completion</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div className="bg-orange-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">85% complete</p>
                </div>
                <div className="text-center pt-2">
                  <Link
                    href="/profile/edit"
                    className="inline-flex items-center gap-2 text-orange-700 hover:text-orange-800 font-medium text-sm"
                  >
                    <Settings className="w-3 h-3" />
                    Complete Profile
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmationModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={confirmLogout}
        title="Sign Out"
        message="Are you sure you want to sign out? You will need to login again to access your account."
        confirmText="Sign Out"
        type="danger"
      />
    </main>
  );
}

export default function ProfilePage() {
  return (
    <React.Suspense fallback={
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </main>
    }>
      <ProfileContent />
    </React.Suspense>
  );
}
"use client";
import React, { useEffect, useState, Suspense } from 'react';
import { User, Mail, Phone, Save, ArrowLeft, Star, Heart, Users, MapPin, Calendar, Loader2, DollarSign, LocateFixed, Check } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/context/ToastContext';

interface ProfileData {
    name: string;
    email: string;
    phone: string;
    gender: string;
    bio: string;
    interests: string[];
    rating: number;
    reviews: number;
    location: string;
    age: string;
    isLookingForRoommate: boolean;
    locationCoordinates?: { lat: number; lng: number };
    budget: { min: number; max: number };
}

const INTEREST_OPTIONS = [
    'Traveling', 'Reading', 'Cooking', 'Gaming', 'Fitness',
    'Photography', 'Music', 'Movies', 'Sports', 'Art',
    'Technology', 'Nature', 'Yoga', 'Dancing', 'Writing'
];

function EditProfileContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const userId = searchParams.get('userId');
    const { user, loading: authLoading } = useAuth();
    const { showToast } = useToast();

    const [profileData, setProfileData] = useState<ProfileData>({
        name: '',
        email: '',
        phone: '',
        gender: '',
        bio: '',
        interests: [],
        rating: 0,
        reviews: 0,
        location: '',
        age: '',
        isLookingForRoommate: false,
        budget: { min: 0, max: 0 }
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [gettingLocation, setGettingLocation] = useState(false);

    useEffect(() => {
        const loadProfile = async () => {
            const targetUserId = userId || user?.uid;
            if (!targetUserId) {
                if (!authLoading) {
                    router.push('/auth/login');
                }
                return;
            }

            try {
                const userDoc = await getDoc(doc(db, 'users', targetUserId));

                if (userDoc.exists()) {
                    const data = userDoc.data();
                    setProfileData({
                        name: data.name || user?.displayName || '',
                        email: data.email || user?.email || '',
                        phone: data.phone || '',
                        gender: data.gender || '',
                        bio: data.bio || '',
                        interests: data.interests || [],
                        rating: data.rating || 4.5,
                        reviews: data.reviews || 0,
                        location: data.location || '',
                        age: data.age || '',
                        isLookingForRoommate: data.isLookingForRoommate || false,
                        locationCoordinates: data.locationCoordinates,
                        budget: data.budget || { min: 0, max: 0 }
                    });
                } else {
                    // Initialize with auth data
                    setProfileData(prev => ({
                        ...prev,
                        name: user?.displayName || '',
                        email: user?.email || ''
                    }));
                }
            } catch (error) {
                console.error('Error loading profile:', error);
                showToast('Failed to load profile data', 'error');
            } finally {
                setLoading(false);
            }
        };

        if (!authLoading) {
            loadProfile();
        }
    }, [user, userId, authLoading, router, showToast]);

    const handleInputChange = (field: keyof ProfileData, value: any) => {
        setProfileData(prev => ({ ...prev, [field]: value }));
    };

    const handleBudgetChange = (type: 'min' | 'max', value: string) => {
        const numVal = parseInt(value) || 0;
        setProfileData(prev => ({
            ...prev,
            budget: { ...prev.budget, [type]: numVal }
        }));
    };

    const toggleInterest = (interest: string) => {
        setProfileData(prev => ({
            ...prev,
            interests: prev.interests.includes(interest)
                ? prev.interests.filter(i => i !== interest)
                : [...prev.interests, interest]
        }));
    };

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            showToast("Geolocation is not supported by your browser", 'error');
            return;
        }

        setGettingLocation(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const coords = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                setProfileData(prev => ({
                    ...prev,
                    locationCoordinates: coords
                }));
                showToast("Location updated successfully!", 'success');
                setGettingLocation(false);
            },
            (error) => {
                console.error("Error getting location:", error);
                showToast("Failed to get location. Please allow access.", 'error');
                setGettingLocation(false);
            }
        );
    };

    const handleSave = async () => {
        if (!user) {
            showToast('You must be logged in to save changes', 'error');
            return;
        }

        try {
            setSaving(true);

            await updateDoc(doc(db, 'users', user.uid), {
                name: profileData.name,
                phone: profileData.phone,
                gender: profileData.gender,
                bio: profileData.bio,
                interests: profileData.interests,
                location: profileData.location,
                age: profileData.age,
                isLookingForRoommate: profileData.isLookingForRoommate,
                locationCoordinates: profileData.locationCoordinates,
                budget: profileData.budget,
                updatedAt: new Date()
            });

            showToast('Profile updated successfully!', 'success');

            // Redirect after short delay
            setTimeout(() => {
                router.push('/profile');
            }, 1000);
        } catch (error) {
            console.error('Error saving profile:', error);
            showToast('Failed to save changes. Please try again.', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-orange-600 mx-auto" />
                    <p className="mt-4 text-gray-600">Loading profile...</p>
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Edit Profile</h1>
                        <p className="text-gray-500 mt-1">Update your personal information</p>
                    </div>
                    <Link
                        href="/profile"
                        className="flex items-center gap-2 text-gray-600 hover:text-orange-600 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Back to Profile
                    </Link>
                </div>

                {/* Profile Form */}
                <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">

                    {/* Rating Display */}
                    <div className="flex items-center gap-4 mb-8 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl">
                        <div className="flex items-center gap-2">
                            <Star className="w-6 h-6 text-yellow-500 fill-current" />
                            <span className="text-2xl font-bold text-gray-900">{profileData.rating.toFixed(1)}</span>
                        </div>
                        <div className="text-gray-600">
                            <span className="font-medium">{profileData.reviews} reviews</span>
                        </div>
                    </div>

                    <div className="space-y-8">
                        {/* Section: Basic Info */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Basic Info</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <User className="w-4 h-4 inline mr-2" />
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        value={profileData.name}
                                        onChange={(e) => handleInputChange('name', e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                                        placeholder="Your full name"
                                    />
                                </div>

                                {/* Email (Read-only) */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <Mail className="w-4 h-4 inline mr-2" />
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={profileData.email}
                                        disabled
                                        className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                                    />
                                </div>

                                {/* Phone */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <Phone className="w-4 h-4 inline mr-2" />
                                        Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        value={profileData.phone}
                                        onChange={(e) => handleInputChange('phone', e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                                        placeholder="+1 (555) 000-0000"
                                    />
                                </div>

                                {/* Gender */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <Users className="w-4 h-4 inline mr-2" />
                                        Gender
                                    </label>
                                    <select
                                        value={profileData.gender}
                                        onChange={(e) => handleInputChange('gender', e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                                    >
                                        <option value="">Select gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                        <option value="Prefer not to say">Prefer not to say</option>
                                    </select>
                                </div>

                                {/* Age */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <Calendar className="w-4 h-4 inline mr-2" />
                                        Age
                                    </label>
                                    <input
                                        type="number"
                                        min="18"
                                        max="100"
                                        value={profileData.age}
                                        onChange={(e) => handleInputChange('age', e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                                        placeholder="Your age"
                                    />
                                </div>

                                {/* Location (Text) */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <MapPin className="w-4 h-4 inline mr-2" />
                                        City
                                    </label>
                                    <input
                                        type="text"
                                        value={profileData.location}
                                        onChange={(e) => handleInputChange('location', e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                                        placeholder="City, Country"
                                    />
                                </div>
                            </div>

                            {/* Bio */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Bio
                                </label>
                                <textarea
                                    value={profileData.bio}
                                    onChange={(e) => handleInputChange('bio', e.target.value)}
                                    rows={4}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none resize-none"
                                    placeholder="Tell others about yourself..."
                                />
                            </div>

                            {/* Interests */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    <Heart className="w-4 h-4 inline mr-2" />
                                    Interests
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {INTEREST_OPTIONS.map((interest) => (
                                        <button
                                            key={interest}
                                            type="button"
                                            onClick={() => toggleInterest(interest)}
                                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${profileData.interests.includes(interest)
                                                ? 'bg-orange-500 text-white hover:bg-orange-600'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                        >
                                            {interest}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Section: Roommate Preferences */}
                        <div className="space-y-6 pt-6 border-t border-gray-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Roommate Settings</h3>
                                    <p className="text-sm text-gray-500">Enable this to be found by others</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={profileData.isLookingForRoommate}
                                        onChange={(e) => handleInputChange('isLookingForRoommate', e.target.checked)}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                                </label>
                            </div>

                            {profileData.isLookingForRoommate && (
                                <div className="bg-orange-50 rounded-xl p-6 space-y-6 animate-in slide-in-from-top-4 duration-300">
                                    {/* Budget */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Monthly Budget ($)
                                        </label>
                                        <div className="flex items-center gap-4">
                                            <div className="relative flex-1">
                                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                <input
                                                    type="number"
                                                    value={profileData.budget.min}
                                                    onChange={(e) => handleBudgetChange('min', e.target.value)}
                                                    className="w-full pl-9 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                                                    placeholder="Min"
                                                />
                                            </div>
                                            <span className="text-gray-400">-</span>
                                            <div className="relative flex-1">
                                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                <input
                                                    type="number"
                                                    value={profileData.budget.max}
                                                    onChange={(e) => handleBudgetChange('max', e.target.value)}
                                                    className="w-full pl-9 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                                                    placeholder="Max"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Exact Location */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Current Location (for distance calculation)
                                        </label>
                                        <div className="flex items-center gap-4">
                                            <button
                                                type="button"
                                                onClick={handleGetLocation}
                                                disabled={gettingLocation}
                                                className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors w-full justify-center"
                                            >
                                                {gettingLocation ? (
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                ) : profileData.locationCoordinates ? (
                                                    <Check className="w-5 h-5 text-green-600" />
                                                ) : (
                                                    <LocateFixed className="w-5 h-5" />
                                                )}
                                                {gettingLocation ? 'Getting location...' : profileData.locationCoordinates ? 'Location Saved (Click to Update)' : 'Get Current Location'}
                                            </button>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-2">
                                            We need your precise location to show you roommates nearby. This won't be public.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 mt-8 pt-6 border-t border-gray-200">
                        <Link
                            href="/profile"
                            className="flex-1 px-6 py-3 text-center border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </Link>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex-1 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}

export default function EditProfilePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-orange-600 mx-auto" />
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        }>
            <EditProfileContent />
        </Suspense>
    );
}

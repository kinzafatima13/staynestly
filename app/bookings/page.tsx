"use client";
import React, { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion, addDoc, serverTimestamp } from 'firebase/firestore';
import { Calendar, MapPin, User, Users, Plus, X, Search, CheckCircle, MessageSquare, DollarSign, PieChart, Share2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/context/ToastContext';
import { fetchRoommates, Roommate } from '@/lib/data';
import dynamic from 'next/dynamic';

const RoommateMap = dynamic(() => import('@/components/RoommateMap'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-[300px] bg-gray-100 animate-pulse rounded-xl flex items-center justify-center text-gray-400">
            <MapPin className="w-8 h-8 opacity-50" />
        </div>
    )
});

interface Booking {
    id: string;
    propertyTitle: string;
    checkInDate: any;
    checkOutDate: any;
    totalGuests: number;
    totalCost: number;
    status: string;
    buddies?: string[]; // Array of buddy emails
    billSplits?: { [email: string]: number }; // percentage or amount mapping
    imageUrl?: string;
    city?: string;
    isShared?: boolean; // Client-side flag
}

interface Invitation {
    id: string;
    bookingId: string;
    inviterEmail: string;
    inviterName: string;
    inviteeEmail: string;
    status: 'pending' | 'accepted' | 'rejected';
    propertyTitle: string;
    checkInDate: any;
    checkOutDate: any;
    splitType: 'percentage' | 'amount';
    splitValue: number;
    createdAt: any;
    read?: boolean;
}

export default function GuestBookingsPage() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);

    // Add Buddy Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
    const [buddyEmail, setBuddyEmail] = useState('');
    const [isAddingBuddy, setIsAddingBuddy] = useState(false);

    // Bill Splitting State
    const [splitType, setSplitType] = useState<'percentage' | 'amount'>('percentage');
    const [splitValue, setSplitValue] = useState<string>('50');

    // Nearby Search State
    const [activeTab, setActiveTab] = useState<'email' | 'nearby'>('email');
    const [nearbyRoommates, setNearbyRoommates] = useState<Roommate[]>([]);
    const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
    const [isSearchingNearby, setIsSearchingNearby] = useState(false);
    const [usingDefaultLocation, setUsingDefaultLocation] = useState(false);

    // Invitations State
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [sentInvitations, setSentInvitations] = useState<Invitation[]>([]);

    useEffect(() => {
        async function fetchBookings() {
            if (!user || !user.email) return;

            try {
                // 1. Fetch My Bookings (created by me)
                const myBookingsQuery = query(collection(db, 'bookings'), where('userId', '==', user.uid));

                // 2. Fetch Shared Bookings (where I am a buddy)
                const sharedBookingsQuery = query(collection(db, 'bookings'), where('buddies', 'array-contains', user.email));

                // 3. Fetch Received Invitations (where I am invitee)
                const receivedInvitesQuery = query(
                    collection(db, 'invitations'),
                    where('inviteeEmail', '==', user.email),
                    where('status', '==', 'pending')
                );

                // 4. Fetch Sent Invitations (where I am inviter - to show pending status)
                const sentInvitesQuery = query(
                    collection(db, 'invitations'),
                    where('inviterEmail', '==', user.email)
                );

                const [mySnapshot, sharedSnapshot, receivedSnapshot, sentSnapshot] = await Promise.all([
                    getDocs(myBookingsQuery),
                    getDocs(sharedBookingsQuery),
                    getDocs(receivedInvitesQuery),
                    getDocs(sentInvitesQuery)
                ]);

                // ... Process Bookings (existing logic) ...
                const bookingData: Booking[] = [];
                const addedIds = new Set();

                // Process My Bookings
                mySnapshot.forEach((doc) => {
                    if (addedIds.has(doc.id)) return;
                    const data = doc.data();
                    bookingData.push({
                        id: doc.id,
                        propertyTitle: data.propertyTitle || 'Unknown Property',
                        checkInDate: data.checkInDate,
                        checkOutDate: data.checkOutDate,
                        totalGuests: data.totalGuests || 1,
                        totalCost: data.totalCost || 0,
                        status: data.status || 'pending',
                        buddies: data.buddies || [],
                        billSplits: data.billSplits || {},
                        imageUrl: data.propertyImage || '',
                        city: data.propertyCity || '',
                        isShared: false
                    });
                    addedIds.add(doc.id);
                });

                // Process Shared Bookings
                sharedSnapshot.forEach((doc) => {
                    if (addedIds.has(doc.id)) return;
                    const data = doc.data();
                    bookingData.push({
                        id: doc.id,
                        propertyTitle: data.propertyTitle || 'Unknown Property',
                        checkInDate: data.checkInDate,
                        checkOutDate: data.checkOutDate,
                        totalGuests: data.totalGuests || 1,
                        totalCost: data.totalCost || 0,
                        status: data.status || 'pending',
                        buddies: data.buddies || [],
                        billSplits: data.billSplits || {},
                        imageUrl: data.propertyImage || '',
                        city: data.propertyCity || '',
                        isShared: true // Mark as shared
                    });
                    addedIds.add(doc.id);
                });

                // Sort by check-in date (newest first)
                bookingData.sort((a, b) => {
                    const dateA = a.checkInDate?.seconds ? new Date(a.checkInDate.seconds * 1000).getTime() : 0;
                    const dateB = b.checkInDate?.seconds ? new Date(b.checkInDate.seconds * 1000).getTime() : 0;
                    return dateB - dateA;
                });

                setBookings(bookingData);

                // Process Invitations
                const receivedInvites: Invitation[] = [];
                receivedSnapshot.forEach(doc => {
                    const data = doc.data();
                    receivedInvites.push({
                        id: doc.id,
                        bookingId: data.bookingId,
                        inviterEmail: data.inviterEmail,
                        inviterName: data.inviterName,
                        inviteeEmail: data.inviteeEmail,
                        status: data.status,
                        propertyTitle: data.propertyTitle,
                        checkInDate: data.checkInDate,
                        checkOutDate: data.checkOutDate,
                        splitType: data.splitType,
                        splitValue: data.splitValue,
                        createdAt: data.createdAt,
                        read: data.read || false // Handle existing docs
                    });
                });
                setInvitations(receivedInvites);

                // Process Sent Invitations
                const sentInvites: Invitation[] = [];
                sentSnapshot.forEach(doc => {
                    const data = doc.data();
                    sentInvites.push({
                        id: doc.id,
                        bookingId: data.bookingId,
                        inviterEmail: data.inviterEmail,
                        inviterName: data.inviterName,
                        inviteeEmail: data.inviteeEmail,
                        status: data.status,
                        propertyTitle: data.propertyTitle,
                        checkInDate: data.checkInDate,
                        checkOutDate: data.checkOutDate,
                        splitType: data.splitType,
                        splitValue: data.splitValue,
                        createdAt: data.createdAt,
                        read: data.read || false
                    });
                });
                setSentInvitations(sentInvites);

            } catch (error) {
                console.error("Error fetching bookings:", error);
                showToast("Failed to load bookings", "error");
            } finally {
                setLoading(false);
            }
        }

        fetchBookings();
    }, [user, showToast]);

    // Calculate distance helper
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const R = 6371; // Radius of Earth in kilometers
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        return Math.round(distance * 10) / 10;
    };

    const handleFindNearby = () => {
        setIsSearchingNearby(true);

        const loadWithLocation = async (lat: number, lng: number) => {
            try {
                const roommates = await fetchRoommates(user?.uid);

                // Filter roommates within 50km
                const nearby = roommates.map(r => ({
                    ...r,
                    distance: calculateDistance(lat, lng, r.location.lat, r.location.lng)
                })).filter(r => r.distance !== undefined && r.distance <= 50)
                    .sort((a, b) => (a.distance || 0) - (b.distance || 0));

                setNearbyRoommates(nearby);
            } catch (error) {
                console.error("Error fetching nearby roommates:", error);
                showToast("Failed to find nearby roommates", 'error');
            } finally {
                setIsSearchingNearby(false);
            }
        };

        // Check for Secure Context (HTTPS)
        const isSecure = typeof window !== 'undefined' ? window.isSecureContext : true;
        if (!isSecure && typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
            alert("⚠️ Location requires HTTPS. If testing on mobile via IP, please use localhost or a secure tunnel.");
        }

        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const location = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    setUserLocation(location);
                    setUsingDefaultLocation(false);
                    loadWithLocation(location.lat, location.lng);
                },
                (error) => {
                    console.error("Geolocation error:", error);
                    let msg = "Could not get your location.";
                    if (error.code === error.PERMISSION_DENIED) {
                        msg = "Location permission denied.";
                    } else if (error.code === error.POSITION_UNAVAILABLE) {
                        msg = "Location unavailable.";
                    } else if (error.code === error.TIMEOUT) {
                        msg = "Location timed out.";
                    }

                    showToast(`${msg} Using default (NYC).`, 'warning');

                    // Fallback to default location (NYC)
                    const defaultLoc = { lat: 40.7128, lng: -74.0060 };
                    setUserLocation(defaultLoc);
                    setUsingDefaultLocation(true);
                    loadWithLocation(defaultLoc.lat, defaultLoc.lng);
                },
                { timeout: 15000, enableHighAccuracy: true }
            );
        } else {
            showToast("Geolocation not supported. Using default (NYC).", 'warning');
            const defaultLoc = { lat: 40.7128, lng: -74.0060 };
            setUserLocation(defaultLoc);
            setUsingDefaultLocation(true);
            loadWithLocation(defaultLoc.lat, defaultLoc.lng);
        }
    };

    const handleSelectRoommate = (identifier: string) => {
        // identifier could be email or ID if coming from map
        let roommate = nearbyRoommates.find(r => r.email === identifier);

        // If not found by email, try by ID (map click passes ID)
        if (!roommate) {
            roommate = nearbyRoommates.find(r => r.id === identifier);
        }

        if (!roommate || !roommate.email) {
            showToast("This user does not have a public email.", "warning");
            return;
        }

        setBuddyEmail(roommate.email);
        setActiveTab('email');
    };

    const handleAcceptInvitation = async (invitation: Invitation) => {
        try {
            // 1. Update Invitation Status
            const inviteRef = doc(db, 'invitations', invitation.id);
            await updateDoc(inviteRef, { status: 'accepted' });

            // 2. Add as Buddy to Booking
            // 2. Add as Buddy to Booking
            const bookingRef = doc(db, 'bookings', invitation.bookingId);

            // Simplified: Add buddy email first.
            // Note: In a production app, we would calculate and store the agreed bill split here.
            // For now, we rely on the host to manage splits or track it via invitation metadata if needed.

            // Refined Plan:
            // 1. Mark invite accepted.
            // 2. Add user to `buddies` array.
            // 3. (Optional) Add to `billSplits` if we can calc it.

            await updateDoc(bookingRef, {
                buddies: arrayUnion(user?.email)
            });

            // Update User Availability (busyUntil)
            try {
                if (user && user.uid) {
                    const userRef = doc(db, 'users', user.uid);
                    await updateDoc(userRef, {
                        busyUntil: invitation.checkOutDate
                    });
                }
            } catch (err) {
                console.error("Error updating user busy status:", err);
            }

            // Update Local State
            setInvitations(prev => prev.filter(i => i.id !== invitation.id));

            // Refresh bookings to show the new shared booking
            // We can just trigger a reload or manually add to state if we fetched the booking.
            // Safest is to reload page or re-fetch.
            window.location.reload();

            showToast("Invitation accepted! You joined the trip.", "success");
        } catch (error) {
            console.error("Error accepting invite:", error);
            showToast("Failed to join trip", "error");
        }
    };

    const handleRejectInvitation = async (invitationId: string) => {
        try {
            const inviteRef = doc(db, 'invitations', invitationId);
            await updateDoc(inviteRef, { status: 'rejected' });

            setInvitations(prev => prev.filter(i => i.id !== invitationId));
            showToast("Invitation rejected.", "info");
        } catch (error) {
            console.error("Error rejecting invite:", error);
            showToast("Failed to reject invitation", "error");
        }
    };

    const handleAddBuddy = async () => {
        if (!buddyEmail || !selectedBookingId) return;

        setIsAddingBuddy(true);
        try {
            const booking = bookings.find(b => b.id === selectedBookingId);
            if (!booking) return;

            // Calculate actual cost
            let costToSave = 0;
            if (splitType === 'percentage') {
                const percentage = parseFloat(splitValue);
                costToSave = (booking.totalCost * percentage) / 100;
            } else {
                costToSave = parseFloat(splitValue);
            }

            // Create Invitation Document
            const invitationData = {
                bookingId: selectedBookingId,
                inviterEmail: user?.email,
                inviterName: user?.displayName || 'A Host',
                inviteeEmail: buddyEmail,
                status: 'pending',
                splitType,
                splitValue: parseFloat(splitValue),
                propertyTitle: booking.propertyTitle,
                checkInDate: booking.checkInDate,
                checkOutDate: booking.checkOutDate,
                createdAt: serverTimestamp(),
                read: false
            };

            const docRef = await addDoc(collection(db, 'invitations'), invitationData);

            // Update local state (Sent Invitations)
            setSentInvitations(prev => [
                ...prev,
                {
                    ...invitationData,
                    id: docRef.id,
                    createdAt: new Date() // Mock timestamp for immediate UI update
                } as Invitation
            ]);

            showToast(`Invitation sent to ${buddyEmail}! They need to accept it.`, "success");
            setIsModalOpen(false);
            setBuddyEmail('');
            setSplitValue('50');
            setSelectedBookingId(null);
        } catch (error) {
            console.error("Error sending invitation:", error);
            showToast("Failed to send invitation", "error");
        } finally {
            setIsAddingBuddy(false);
        }
    };

    const openBuddyModal = (bookingId: string) => {
        setSelectedBookingId(bookingId);
        setActiveTab('email');
        setNearbyRoommates([]);
        // Default split set to 50%
        setSplitType('percentage');
        setSplitValue('50');
        setIsModalOpen(true);
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'N/A';
        // Handle Firestore Timestamp or Date string
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    // Helper to get split amount for display
    const getSplitAmount = (booking: Booking, email: string) => {
        if (!booking.billSplits) return null;
        // Check sanitized key
        const sanitizedEmail = email.replace(/\./g, ',');
        const amount = booking.billSplits[sanitizedEmail];

        return amount ? `$${amount.toFixed(2)}` : null;
    };

    return (
        <ProtectedRoute>
            <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-5xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <h1 className="text-3xl font-bold text-slate-900">My Bookings</h1>
                        <Link href="/search" className="text-orange-600 font-medium hover:text-orange-700">
                            Find more stays
                        </Link>
                    </div>

                    {loading ? (
                        <div className="text-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
                            <p className="text-slate-500">Loading your bookings...</p>
                        </div>
                    ) : bookings.length === 0 ? (
                        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
                            <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Calendar className="w-8 h-8" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 mb-2">No bookings yet</h2>
                            <p className="text-slate-500 mb-6">You haven't made any bookings yet.</p>
                            <Link
                                href="/search"
                                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl shadow-sm text-white bg-orange-600 hover:bg-orange-700"
                            >
                                Start Exploring
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Pending Invitations Section */}
                            {invitations.length > 0 && (
                                <div className="space-y-4 mb-8">
                                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                        <MessageSquare className="w-5 h-5 text-orange-600" />
                                        Trip Invitations
                                    </h2>
                                    {invitations.map(invite => (
                                        <div key={invite.id} className="bg-white rounded-xl p-4 border border-orange-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
                                                    <User className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-gray-900">{invite.inviterName} invited you to join a trip!</h3>
                                                    <p className="text-sm text-gray-600">
                                                        {invite.propertyTitle} • {formatDate(invite.checkInDate)} - {formatDate(invite.checkOutDate)}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Requested Split: {invite.splitType === 'percentage' ? `${invite.splitValue}%` : `$${invite.splitValue}`}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 w-full md:w-auto">
                                                <button
                                                    onClick={() => handleRejectInvitation(invite.id)}
                                                    className="flex-1 md:flex-none px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                                                >
                                                    Decline
                                                </button>
                                                <button
                                                    onClick={() => handleAcceptInvitation(invite)}
                                                    className="flex-1 md:flex-none px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium transition-colors shadow-sm"
                                                >
                                                    Accept & Join
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {bookings.map((booking) => {
                                // Filter pending invites for this booking
                                const pendingBuddiesForBooking = sentInvitations.filter(
                                    inv => inv.bookingId === booking.id && inv.status === 'pending'
                                );

                                return (
                                    <div key={booking.id} className={`bg-white rounded-2xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow relative ${booking.isShared ? 'border-blue-200' : 'border-gray-200'}`}>
                                        {/* Shared Badge */}
                                        {booking.isShared && (
                                            <div className="bg-blue-50 border-b border-blue-100 px-6 py-2 flex items-center gap-2 text-sm text-blue-700 font-medium">
                                                <Share2 className="w-4 h-4" />
                                                Shared Booking • You are a guest
                                            </div>
                                        )}

                                        <div className="p-6 sm:p-8">
                                            <div className="flex flex-col md:flex-row justify-between gap-6">
                                                {/* Booking Info */}
                                                <div className="flex-1">
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div>
                                                            <h3 className="text-xl font-bold text-slate-900 mb-1">{booking.propertyTitle}</h3>
                                                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                                                    booking.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                                                    }`}>
                                                                    {booking.status}
                                                                </span>
                                                                <span>•</span>
                                                                <span>ID: {booking.id.substring(0, 8)}</span>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-lg font-bold text-slate-900">${booking.totalCost.toLocaleString()}</p>
                                                            <p className="text-xs text-slate-500">Total Price</p>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                                                        <div>
                                                            <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Check-in</p>
                                                            <p className="text-slate-800 font-medium flex items-center gap-2">
                                                                <Calendar className="w-4 h-4 text-orange-500" /> {formatDate(booking.checkInDate)}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Check-out</p>
                                                            <p className="text-slate-800 font-medium flex items-center gap-2">
                                                                <Calendar className="w-4 h-4 text-slate-400" /> {formatDate(booking.checkOutDate)}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Guests</p>
                                                            <p className="text-slate-800 font-medium flex items-center gap-2">
                                                                <Users className="w-4 h-4 text-slate-400" /> {booking.totalGuests}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Buddies Section */}
                                                    <div className="border-t border-gray-100 pt-4 mt-4">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                                                                <Users className="w-4 h-4 text-orange-600" /> Travel Buddies
                                                            </h4>
                                                            {!booking.isShared && (
                                                                <button
                                                                    onClick={() => openBuddyModal(booking.id)}
                                                                    className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
                                                                >
                                                                    <Plus className="w-4 h-4" /> Add Buddy
                                                                </button>
                                                            )}
                                                        </div>

                                                        {(booking.buddies && booking.buddies.length > 0) || pendingBuddiesForBooking.length > 0 ? (
                                                            <div className="flex flex-wrap gap-2">
                                                                {/* Confirmed Buddies */}
                                                                {booking.buddies?.map((buddy, idx) => (
                                                                    <div key={idx} className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium border border-green-100">
                                                                        <div className="flex items-center gap-1.5">
                                                                            <User className="w-3 h-3" />
                                                                            <span>{buddy === user?.email ? 'You' : buddy}</span>
                                                                        </div>
                                                                        {getSplitAmount(booking, buddy) && (
                                                                            <span className="text-xs bg-white/50 px-1.5 rounded text-green-800 font-semibold border border-green-200">
                                                                                {getSplitAmount(booking, buddy)}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                ))}

                                                                {/* Pending Buddies */}
                                                                {pendingBuddiesForBooking.map((invite) => (
                                                                    <div key={invite.id} className="flex items-center gap-2 bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full text-sm font-medium border border-yellow-100 border-dashed">
                                                                        <div className="flex items-center gap-1.5">
                                                                            <User className="w-3 h-3" />
                                                                            <span>{invite.inviteeEmail} (Pending)</span>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <p className="text-sm text-slate-400 italic">No buddies added yet. Invite friends to join you!</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Add Buddy Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold text-slate-900">Add a Travel Buddy</h3>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="p-1 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Tabs */}
                            <div className="flex border-b border-gray-100 mb-6">
                                <button
                                    className={`flex-1 pb-3 text-sm font-medium transition-colors ${activeTab === 'email' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-500 hover:text-gray-700'}`}
                                    onClick={() => setActiveTab('email')}
                                >
                                    By Email
                                </button>
                                <button
                                    className={`flex-1 pb-3 text-sm font-medium transition-colors ${activeTab === 'nearby' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-500 hover:text-gray-700'}`}
                                    onClick={() => {
                                        setActiveTab('nearby');
                                        if (nearbyRoommates.length === 0) handleFindNearby();
                                    }}
                                >
                                    Find Nearby
                                </button>
                            </div>

                            <div className="overflow-y-auto flex-1 px-1">
                                {activeTab === 'email' ? (
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                                Buddy's Email Address
                                            </label>
                                            <div className="relative">
                                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                <input
                                                    type="email"
                                                    value={buddyEmail}
                                                    onChange={(e) => setBuddyEmail(e.target.value)}
                                                    placeholder="friend@example.com"
                                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                                                />
                                            </div>
                                            <p className="text-xs text-slate-500 mt-2">
                                                We'll add them to your booking details.
                                            </p>
                                        </div>

                                        {/* Bill Splitting Section */}
                                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                            <label className="block text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                                                <DollarSign className="w-4 h-4 text-green-600" /> Bill Splitting
                                            </label>

                                            <div className="flex gap-2 mb-3">
                                                <button
                                                    onClick={() => setSplitType('percentage')}
                                                    className={`flex-1 py-1.5 text-xs font-medium rounded-lg border ${splitType === 'percentage'
                                                        ? 'bg-white border-green-500 text-green-700 shadow-sm'
                                                        : 'bg-transparent border-gray-300 text-gray-500'}`}
                                                >
                                                    Percentage (%)
                                                </button>
                                                <button
                                                    onClick={() => setSplitType('amount')}
                                                    className={`flex-1 py-1.5 text-xs font-medium rounded-lg border ${splitType === 'amount'
                                                        ? 'bg-white border-green-500 text-green-700 shadow-sm'
                                                        : 'bg-transparent border-gray-300 text-gray-500'}`}
                                                >
                                                    Fixed Amount ($)
                                                </button>
                                            </div>

                                            <div className="relative">
                                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                                    {splitType === 'percentage' ? <PieChart className="w-4 h-4" /> : <DollarSign className="w-4 h-4" />}
                                                </div>
                                                <input
                                                    type="number"
                                                    value={splitValue}
                                                    onChange={(e) => setSplitValue(e.target.value)}
                                                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                                                    placeholder={splitType === 'percentage' ? "50" : "100"}
                                                />
                                                {splitType === 'percentage' && (
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</div>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 mt-2">
                                                {splitType === 'percentage'
                                                    ? `They will pay ${splitValue}% of the total booking cost.`
                                                    : `They will pay $${splitValue} towards the booking.`}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm text-slate-600">Find travelers near you to split the stay!</p>
                                            <button
                                                onClick={handleFindNearby}
                                                className="text-xs text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
                                            >
                                                <MapPin className="w-3 h-3" /> Refresh Location
                                            </button>
                                        </div>

                                        {usingDefaultLocation && (
                                            <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded flex items-center justify-center">
                                                <span>📍 Using default location (NYC). Tap "Refresh Location" with permission.</span>
                                            </div>
                                        )}

                                        {isSearchingNearby ? (
                                            <div className="py-12 text-center">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-3"></div>
                                                <p className="text-sm text-slate-500">Scanning for nearby roommates...</p>
                                            </div>
                                        ) : (
                                            <>
                                                {/* Map Section */}
                                                <div className="mb-4 rounded-xl overflow-hidden shadow-sm border border-gray-100">
                                                    <RoommateMap
                                                        roommates={nearbyRoommates.filter(r => r.email)} // Only show roommates with emails
                                                        userLocation={userLocation}
                                                        onRoommateClick={handleSelectRoommate}
                                                    />
                                                </div>

                                                {nearbyRoommates.length > 0 ? (
                                                    <div className="space-y-3">
                                                        {nearbyRoommates.map(roommate => (
                                                            <div key={roommate.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors group">
                                                                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                                                                    <img src={roommate.image || 'https://via.placeholder.com/150'} alt={roommate.name} className="w-full h-full object-cover" />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <h4 className="text-sm font-semibold text-slate-900 truncate">{roommate.name}</h4>
                                                                    <p className="text-xs text-slate-500 truncate">{roommate.bio}</p>
                                                                    <div className="flex items-center gap-2 mt-1">
                                                                        <span className="text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded">{roommate.distance}km away</span>
                                                                        <span className="text-xs text-slate-400">• {roommate.gender}</span>
                                                                        <Link
                                                                            href={`/profile?userId=${roommate.id}`}
                                                                            target="_blank"
                                                                            className="text-xs text-blue-600 hover:text-blue-800 font-medium ml-1 flex items-center gap-1"
                                                                        >
                                                                            View Profile
                                                                        </Link>
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    onClick={() => handleSelectRoommate(roommate.email || '')}
                                                                    className="text-sm bg-orange-100 text-orange-700 px-3 py-1.5 rounded-lg font-medium hover:bg-orange-200 transition-colors opacity-0 group-hover:opacity-100"
                                                                >
                                                                    Select
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-10 bg-gray-50 rounded-xl">
                                                        <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                                        <p className="text-sm text-slate-500">No active roommates found nearby.</p>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 pt-6 border-t border-gray-100 mt-4">
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-3 px-4 border border-gray-300 rounded-xl text-slate-700 font-semibold hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddBuddy}
                                    disabled={isAddingBuddy || !buddyEmail}
                                    className="flex-1 py-3 px-4 bg-orange-600 rounded-xl text-white font-semibold hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isAddingBuddy ? 'Adding...' : 'Add Buddy'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </ProtectedRoute>
    );
}

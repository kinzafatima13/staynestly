"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { Bell, Calendar, DollarSign, User, MessageSquare, ArrowLeft, CheckCircle } from 'lucide-react';
import Link from 'next/link';

interface BookingNotification {
    id: string;
    guestId: string;
    guestName: string;
    guestEmail: string;
    guestPhone: string;
    guestPhoto?: string;
    guestBio?: string;
    propertyTitle: string;
    checkIn: string;
    checkOut: string;
    guests: number;
    totalCost: number;
    status: string;
    createdAt: any;
    read: boolean;
}

export default function NotificationsPage() {
    const router = useRouter();
    const { user, role, loading: authLoading } = useAuth();
    const [notifications, setNotifications] = useState<BookingNotification[]>([]);
    const [invitations, setInvitations] = useState<any[]>([]); // New state for guest invitations
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // ALLOW Guests now! Run check only for unauthenticated users
        if (!authLoading && !user) {
            router.push('/auth/login');
            return;
        }

        if (!user) return;

        const fetchNotifications = async () => {
            try {
                setLoading(true);

                if (role === 'host') {
                    // --- HOST LOGIC (Existing) ---
                    const bookingsQuery = query(
                        collection(db, 'bookings'),
                        where('ownerId', '==', user.uid)
                    );

                    const snapshot = await getDocs(bookingsQuery);
                    const notifs: BookingNotification[] = [];

                    for (const bookingDoc of snapshot.docs) {
                        const bookingData = bookingDoc.data();
                        let guestPhoto = '';
                        let guestBio = '';

                        if (bookingData.userId) {
                            try {
                                const userDocRef = doc(db, 'users', bookingData.userId);
                                const userDocSnap = await getDoc(userDocRef);
                                if (userDocSnap.exists()) {
                                    const userData = userDocSnap.data();
                                    guestPhoto = userData.photoURL || userData.image || '';
                                    guestBio = userData.bio || '';
                                }
                            } catch (err) {
                                console.warn('Error fetching guest details', err);
                            }
                        }

                        notifs.push({
                            id: bookingDoc.id,
                            guestId: bookingData.userId,
                            guestName: bookingData.guestName || 'Guest',
                            guestEmail: bookingData.guestEmail || '',
                            guestPhone: bookingData.guestPhone || '',
                            guestPhoto,
                            guestBio,
                            propertyTitle: bookingData.propertyTitle || 'Property',
                            checkIn: bookingData.checkInDate,
                            checkOut: bookingData.checkOutDate,
                            guests: bookingData.totalGuests || 1,
                            totalCost: bookingData.totalCost || 0,
                            status: bookingData.status || 'pending',
                            createdAt: bookingData.createdAt,
                            read: false
                        });
                    }

                    // Sort notifications by date desc (newest first) client-side
                    notifs.sort((a, b) => {
                        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
                        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
                        return dateB.getTime() - dateA.getTime();
                    });

                    setNotifications(notifs);
                } else {
                    // --- GUEST LOGIC (Invites) ---
                    const invitesQuery = query(
                        collection(db, 'invitations'),
                        where('inviteeEmail', '==', user.email)
                    );

                    const snapshot = await getDocs(invitesQuery);
                    const invites: any[] = [];

                    snapshot.forEach(doc => {
                        const data = doc.data();
                        invites.push({
                            id: doc.id,
                            ...data,
                            // Ensure createdAt is handled safely
                            createdAt: data.createdAt
                        });
                    });

                    // Sort invites desc
                    invites.sort((a, b) => {
                        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
                        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
                        return dateB.getTime() - dateA.getTime();
                    });

                    setInvitations(invites);
                }

            } catch (error) {
                console.error('Error fetching notifications:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchNotifications();
        fetchNotifications();
    }, [user, role, authLoading, router]);

    const handleViewInvitation = async (invitationId: string) => {
        try {
            // Mark as read in Firestore
            const inviteRef = doc(db, 'invitations', invitationId);
            await updateDoc(inviteRef, { read: true });

            // Update local state to reflect change immediately (optional if redirecting, but good for UX)
            setInvitations(prev => prev.map(inv => inv.id === invitationId ? { ...inv, read: true } : inv));

            // Navigate to bookings
            router.push('/bookings');
        } catch (error) {
            console.error("Error marking invitation as read:", error);
            // Navigate anyway
            router.push('/bookings');
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            {/* Header */}
            <div className="bg-white border-b shadow-sm sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
                    <Link href={role === 'host' ? "/dashboard" : "/"} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </Link>
                    <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Bell className="w-5 h-5 text-orange-600" />
                        Notifications
                    </h1>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-8">
                {(role === 'host' && notifications.length === 0) || (role !== 'host' && invitations.length === 0) ? (
                    <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-200">
                        <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications yet</h3>
                        <p className="text-gray-500">
                            {role === 'host' ? "When you receive bookings, they will appear here." : "Trip invitations and alerts will appear here."}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* HOST NOTIFICATIONS */}
                        {role === 'host' && notifications.map((notif) => (
                            <div
                                key={notif.id}
                                className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300"
                            >
                                {/* Notification Header */}
                                <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-orange-50/50 to-transparent">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-green-100 text-green-700 rounded-lg">
                                            <Calendar className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900">New Booking Update</h3>
                                            <p className="text-sm text-gray-600">
                                                {notif.createdAt?.toDate ? notif.createdAt.toDate().toLocaleDateString() : 'Recently'} • {notif.propertyTitle}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`px-3 py-1 text-sm font-medium rounded-full ${notif.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                            notif.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {notif.status.charAt(0).toUpperCase() + notif.status.slice(1)}
                                        </span>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-6">
                                    <div className="flex flex-col md:flex-row gap-8">
                                        {/* Guest Profile Section */}
                                        <div className="md:w-1/3 flex flex-col items-center md:items-start border-b md:border-b-0 md:border-r border-gray-100 pb-6 md:pb-0 md:pr-6">
                                            <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                                <User className="w-4 h-4" /> Guest Profile
                                            </h4>

                                            <div className="flex flex-col items-center md:items-start text-center md:text-left w-full">
                                                <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-orange-100 mb-3 shadow-sm">
                                                    {notif.guestPhoto ? (
                                                        <img src={notif.guestPhoto} alt={notif.guestName} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                                            <User className="w-8 h-8 text-gray-400" />
                                                        </div>
                                                    )}
                                                </div>

                                                <h3 className="text-lg font-bold text-gray-900">{notif.guestName}</h3>
                                                <p className="text-sm text-gray-500 mb-3">{notif.guestEmail}</p>

                                                {notif.guestBio && (
                                                    <div className="bg-gray-50 p-3 rounded-lg w-full text-sm text-gray-600 italic mb-4">
                                                        "{notif.guestBio}"
                                                    </div>
                                                )}

                                                <div className="w-full space-y-2">
                                                    <Link
                                                        href={`/profile?userId=${notif.guestId}`}
                                                        className="flex items-center justify-center gap-2 w-full py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm transition-colors"
                                                    >
                                                        <User className="w-4 h-4" />
                                                        View Full Profile
                                                    </Link>
                                                    {/* WhatsApp Placeholder */}
                                                    {(notif.guestPhone) && (
                                                        <a
                                                            href={`https://wa.me/${notif.guestPhone.replace(/[^0-9]/g, '')}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="flex items-center justify-center gap-2 w-full py-2 bg-green-50 border border-green-200 text-green-700 rounded-lg hover:bg-green-100 font-medium text-sm transition-colors"
                                                        >
                                                            <MessageSquare className="w-4 h-4" />
                                                            Contact Guest
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Booking Details Section */}
                                        <div className="flex-1">
                                            <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                                <Calendar className="w-4 h-4" /> Stay Details
                                            </h4>

                                            <div className="grid grid-cols-2 gap-4 mb-6">
                                                <div className="p-3 bg-gray-50 rounded-xl">
                                                    <p className="text-xs text-gray-500 mb-1">Check-in</p>
                                                    <p className="font-semibold text-gray-900">{new Date(notif.checkIn).toLocaleDateString()}</p>
                                                </div>
                                                <div className="p-3 bg-gray-50 rounded-xl">
                                                    <p className="text-xs text-gray-500 mb-1">Check-out</p>
                                                    <p className="font-semibold text-gray-900">{new Date(notif.checkOut).toLocaleDateString()}</p>
                                                </div>
                                                <div className="p-3 bg-gray-50 rounded-xl">
                                                    <p className="text-xs text-gray-500 mb-1">Guests</p>
                                                    <p className="font-semibold text-gray-900">{notif.guests} Adults</p>
                                                </div>
                                                <div className="p-3 bg-gray-50 rounded-xl">
                                                    <p className="text-xs text-gray-500 mb-1">Total Nights</p>
                                                    <p className="font-semibold text-gray-900">
                                                        {Math.ceil((new Date(notif.checkOut).getTime() - new Date(notif.checkIn).getTime()) / (1000 * 60 * 60 * 24))} Nights
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                                <div>
                                                    <p className="text-xs text-gray-500">Booking Reference</p>
                                                    <p className="font-mono text-sm text-gray-700">{notif.id.slice(0, 8)}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-lg font-bold text-slate-900">${notif.totalCost}</p>
                                                    <p className="text-xs text-slate-500">Total Price</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* GUEST INVITATIONS */}
                        {role !== 'host' && invitations.map((invite) => (
                            <div
                                key={invite.id}
                                className={`rounded-2xl shadow-sm border overflow-hidden transition-all duration-300 ${invite.read
                                        ? 'bg-gray-50 border-gray-100 opacity-75 hover:opacity-100'
                                        : 'bg-white border-orange-200 shadow-md ring-1 ring-orange-100'
                                    }`}
                            >
                                <div className="p-6">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${invite.read ? 'bg-gray-200 text-gray-500' : 'bg-orange-100 text-orange-600'
                                                }`}>
                                                <User className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h3 className={`font-bold text-lg ${invite.read ? 'text-gray-700' : 'text-gray-900'}`}>Trip Invitation</h3>
                                                <p className="text-gray-600">
                                                    <span className={`font-semibold ${invite.read ? 'text-gray-700' : 'text-orange-600'}`}>{invite.inviterName}</span> invited you to join a trip to <span className="font-semibold">{invite.propertyTitle}</span>!
                                                </p>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    {invite.checkInDate?.toDate ? invite.checkInDate.toDate().toLocaleDateString() : 'Date'} - {invite.checkOutDate?.toDate ? invite.checkOutDate.toDate().toLocaleDateString() : 'Date'}
                                                </p>
                                            </div>
                                        </div>
                                        {invite.status === 'pending' && !invite.read && (
                                            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full uppercase tracking-wider animate-pulse">
                                                Action Required
                                            </span>
                                        )}
                                    </div>

                                    <div className="mt-6 flex justify-end">
                                        <button
                                            onClick={() => handleViewInvitation(invite.id)}
                                            className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-lg transition font-medium shadow-sm ${invite.read
                                                    ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                                    : 'bg-orange-600 text-white hover:bg-orange-700 shadow-orange-200'
                                                }`}
                                        >
                                            <CheckCircle className={`w-4 h-4 ${invite.read ? 'text-gray-500' : 'text-white'}`} />
                                            View & Respond
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LayoutDashboard, LogOut, User, ChevronDown, Search, Bell } from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { logout } from '@/lib/auth';
import ConfirmationModal from './ConfirmationModal';

export default function Navbar() {
    const pathname = usePathname();
    const { user, role, loading } = useAuth();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const handleLogoutClick = () => {
        console.log('Logout clicked - opening modal');
        setIsDropdownOpen(false); // Close dropdown
        setShowLogoutConfirm(true); // Open modal
    };

    const confirmLogout = async () => {
        try {
            await logout();
            window.location.href = '/';
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    // Notification Count Logic
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!user) {
            setUnreadCount(0);
            return;
        }

        let unsubscribe = () => { };

        if (role === 'host') {
            // Count host bookings (bookings where ownerId == user.uid, maybe just track 'read' status if we had it, or count recent ones)
            // For now, let's just link to the page. Real-time badge is nicer.
            // Let's assume we want to count 'pending' or 'recent'.
            // The dashboard/page.tsx counts unread notifications.
            // But we don't have a 'notifications' collection.
            // We'll skip complex count logic for host here to avoid index errors, or reuse the 'bookings' query.
            // Safest: Link to page.

            // Actually, user explicitly asked for "notifications ... shown at the main page".
            // Let's try to query 'bookings' for host.
            // NOTE: Using `orderBy` might trigger index error again.
            // Simple query: ownerId == user.uid && status == 'pending' (A pending booking is effective notification).
            const q = query(
                collection(db, 'bookings'),
                where('ownerId', '==', user.uid),
                where('status', '==', 'pending') // Treat pending bookings as notifications
            );
            unsubscribe = onSnapshot(q, (snapshot) => {
                setUnreadCount(snapshot.size);
            });
        } else {
            // Guest: Count pending invitations
            const q = query(
                collection(db, 'invitations'),
                where('inviteeEmail', '==', user.email),
                where('status', '==', 'pending')
            );
            unsubscribe = onSnapshot(q, (snapshot) => {
                setUnreadCount(snapshot.size);
            });
        }

        return () => unsubscribe();
    }, [user, role]);

    // Show these links ONLY if the user is NOT a host
    const isHost = role === 'host';
    const showGuestLinks = !isHost;

    return (
        <nav className="bg-orange-600 text-white shadow-lg sticky top-0 z-[100]">
            <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">

                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="bg-white text-orange-600 font-bold p-2 rounded-lg group-hover:scale-110 transition shadow-md">
                        SN
                    </div>
                    <span className="text-2xl font-bold tracking-tight group-hover:text-orange-100 transition">
                        StayNestly
                    </span>
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-8">
                    <Link href="/" className={`font-medium hover:text-orange-200 transition ${pathname === '/' ? 'text-white' : 'text-orange-100'}`}>
                        Home
                    </Link>

                    {/* 1. BROWSE HOTELS - HIDDEN FOR HOSTS */}
                    {showGuestLinks && (
                        <Link
                            href="/search"
                            className={`flex items-center gap-1 font-medium hover:text-orange-200 transition ${pathname === '/search' ? 'text-white' : 'text-orange-100'}`}
                        >
                            <Search className="w-4 h-4" /> Browse Hotels
                        </Link>
                    )}

                    {/* HOST DASHBOARD - ONLY FOR HOSTS */}
                    {isHost && (
                        <Link href="/dashboard" className={`font-medium hover:text-orange-200 transition ${pathname === '/dashboard' ? 'text-white' : 'text-orange-100'}`}>
                            Host Dashboard
                        </Link>
                    )}

                    {/* GLOBAL NOTIFICATION BELL */}
                    {user && (
                        <Link href="/dashboard/notifications" className="relative p-2 hover:bg-orange-700/50 rounded-full transition">
                            <Bell className="w-5 h-5 text-orange-100" />
                            {unreadCount > 0 && (
                                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-orange-600"></span>
                            )}
                        </Link>
                    )}

                    {/* User Profile Dropdown */}
                    {user ? (
                        <div className="relative">
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="flex items-center gap-3 bg-orange-700 hover:bg-orange-800 px-4 py-2 rounded-full transition shadow-md border border-orange-500"
                            >
                                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-sm font-bold border-2 border-white">
                                    {user.displayName ? user.displayName[0].toUpperCase() : user.email?.[0].toUpperCase() || 'U'}
                                </div>
                                <span className="font-medium max-w-[100px] truncate">{user.displayName || 'User'}</span>
                                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Dropdown Menu */}
                            {isDropdownOpen && (
                                <div className="absolute right-0 mt-3 w-64 bg-white text-slate-800 rounded-xl shadow-xl py-2 border border-gray-100 animate-in fade-in slide-in-from-top-2">
                                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 rounded-t-xl">
                                        <p className="text-sm text-slate-500">Signed in as</p>
                                        <p className="font-bold truncate text-orange-600">{user.email}</p>
                                        <p className="text-xs uppercase font-bold text-gray-400 mt-1">{role || 'User'}</p>
                                    </div>

                                    <div className="p-2">
                                        {/* 2. MY BOOKINGS - HIDDEN FOR HOSTS */}
                                        {showGuestLinks && (
                                            <Link
                                                href="/bookings"
                                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-orange-50 hover:text-orange-600 rounded-lg transition text-left font-medium"
                                            >
                                                <User className="w-4 h-4" /> My Bookings
                                            </Link>
                                        )}

                                        {/* Logout - Visible to everyone */}
                                        <button
                                            onClick={handleLogoutClick}
                                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 hover:text-red-600 rounded-lg transition text-left mt-2 border-t border-gray-100 font-medium"
                                        >
                                            <LogOut className="w-4 h-4" /> Log Out
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Login/Signup Buttons */
                        <div className="flex items-center gap-4">
                            <Link href="/auth/login" className="hover:text-orange-200 font-medium">Login</Link>
                            <Link href="/auth/signup" className="bg-white text-orange-600 px-5 py-2.5 rounded-full font-bold shadow-md hover:bg-orange-50 transition hover:shadow-lg transform hover:-translate-y-0.5">
                                Sign Up
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* Click outside to close */}
            {isDropdownOpen && (
                <div
                    className="fixed inset-0 z-[-1]"
                    onClick={() => setIsDropdownOpen(false)}
                ></div>
            )}

            <ConfirmationModal
                isOpen={showLogoutConfirm}
                onClose={() => setShowLogoutConfirm(false)}
                onConfirm={confirmLogout}
                title="Sign Out"
                message="Are you sure you want to sign out? You will need to login again to access your account."
                confirmText="Sign Out"
                type="danger"
            />
        </nav>
    );
}
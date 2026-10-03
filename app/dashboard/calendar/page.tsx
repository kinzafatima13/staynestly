"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Calendar as CalendarIcon, Users, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface OccupancyData {
    date: string; // YYYY-MM-DD
    count: number;
    guests: {
        name: string;
        propertyName: string;
    }[];
}

export default function CalendarPage() {
    const router = useRouter();
    const { user, role, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [occupancy, setOccupancy] = useState<Record<string, OccupancyData>>({});

    useEffect(() => {
        if (!authLoading && (!user || role !== 'host')) {
            router.push(user ? '/' : '/auth/login');
            return;
        }

        if (!user) return;

        const fetchOccupancy = async () => {
            try {
                setLoading(true);
                const bookingsQuery = query(
                    collection(db, 'bookings'),
                    where('ownerId', '==', user.uid)
                );

                const snapshot = await getDocs(bookingsQuery);
                const occupancyMap: Record<string, OccupancyData> = {};

                snapshot.forEach((doc) => {
                    const booking = doc.data();
                    const checkIn = booking.checkInDate ? new Date(booking.checkInDate) : null;
                    const checkOut = booking.checkOutDate ? new Date(booking.checkOutDate) : null;

                    if (checkIn && checkOut) {
                        let tempDate = new Date(checkIn);
                        // Iterate through every day of the booking
                        while (tempDate < checkOut) {
                            const dateKey = tempDate.toISOString().split('T')[0];

                            if (!occupancyMap[dateKey]) {
                                occupancyMap[dateKey] = { date: dateKey, count: 0, guests: [] };
                            }

                            occupancyMap[dateKey].count += (booking.totalGuests || 1);
                            occupancyMap[dateKey].guests.push({
                                name: booking.guestName || 'Guest',
                                propertyName: booking.propertyTitle || 'Property'
                            });

                            tempDate.setDate(tempDate.getDate() + 1);
                        }
                    }
                });

                setOccupancy(occupancyMap);

            } catch (error) {
                console.error('Error fetching occupancy:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchOccupancy();
    }, [user, role, authLoading, router]);

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        return Array.from({ length: days }, (_, i) => {
            const d = new Date(year, month, i + 1);
            return d;
        });
    };

    const days = getDaysInMonth(currentDate);
    const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
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
                <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
                    <Link href="/dashboard" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </Link>
                    <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5 text-orange-600" />
                        Occupancy Calendar
                    </h1>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-8">

                {/* Calendar Controls */}
                <div className="flex items-center justify-between mb-8 bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
                    <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg">
                        <ChevronLeft className="w-6 h-6 text-gray-600" />
                    </button>
                    <h2 className="text-2xl font-bold text-gray-900">{monthName}</h2>
                    <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg">
                        <ChevronRight className="w-6 h-6 text-gray-600" />
                    </button>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {days.map((date) => {
                        const dateKey = date.toISOString().split('T')[0];
                        const data = occupancy[dateKey];
                        const isToday = new Date().toISOString().split('T')[0] === dateKey;

                        return (
                            <div
                                key={dateKey}
                                className={`bg-white rounded-xl border p-4 transition-all hover:shadow-md ${isToday ? 'border-orange-500 shadow-sm ring-1 ring-orange-200' : 'border-gray-200 shadow-sm'
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
                                    <span className={`font-semibold ${isToday ? 'text-orange-600' : 'text-gray-700'}`}>
                                        {date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })}
                                    </span>
                                    {data?.count > 0 ? (
                                        <span className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full font-bold">
                                            {data.count} Guests
                                        </span>
                                    ) : (
                                        <span className="text-gray-400 text-xs">
                                            Empty
                                        </span>
                                    )}
                                </div>

                                <div className="space-y-2 min-h-[60px]">
                                    {data?.count > 0 ? (
                                        data.guests.map((guest, idx) => (
                                            <div key={idx} className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">
                                                <Users className="w-3 h-3 text-orange-500" />
                                                <span className="truncate flex-1" title={`${guest.name} @ ${guest.propertyName}`}>
                                                    <span className="font-medium text-gray-900">{guest.name}</span>
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-gray-300 text-sm italic">
                                            No bookings
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

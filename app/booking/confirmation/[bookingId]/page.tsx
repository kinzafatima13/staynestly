"use client";
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function BookingConfirmationPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const bookingId = params?.bookingId as string;

  const [booking, setBooking] = useState<any | null>(null);
  const [propertyTitle, setPropertyTitle] = useState<string>('Loading property...');
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  // 1. Fetch Booking and Check Authorization
  useEffect(() => {
    async function loadBooking() {
      if (!user || !bookingId) return;

      const snap = await getDoc(doc(db, 'bookings', bookingId));
      if (!snap.exists()) {
        setLoading(false);
        setBooking(null);
        return;
      }

      const data = { id: snap.id, ...snap.data() } as any;
      setBooking(data);

      // FIX: Check against 'userId' (required by Firestore rules) and 'ownerId'
      const isAuthorized = user.uid === data.userId || user.uid === data.ownerId;
      setAuthorized(isAuthorized);

      setLoading(false);

      // If booking exists, fetch property title immediately
      if (data.hotelId) {
        fetchPropertyTitle(data.hotelId);
      }
    }

    // 2. Separate function to fetch property title (for better readability)
    async function fetchPropertyTitle(hotelId: string) {
      try {
        const propertySnap = await getDoc(doc(db, 'properties', hotelId));
        if (propertySnap.exists()) {
          setPropertyTitle(propertySnap.data().title || 'Property Not Found');
        } else {
          setPropertyTitle('Property Not Found');
        }
      } catch (error) {
        console.error("Error fetching property title:", error);
        setPropertyTitle('Error fetching property title');
      }
    }

    loadBooking();
  }, [user, bookingId]); // Dependencies ensure this runs when user or ID changes


  // Helper function to safely format Firebase Timestamp
  const formatDate = (timestamp: any) => {
    if (timestamp && typeof timestamp.toDate === 'function') {
      return timestamp.toDate().toDateString();
    }
    return new Date(timestamp).toDateString();
  };

  return (
    <ProtectedRoute>
      <main className="max-w-2xl mx-auto p-6 space-y-6">
        {loading ? (
          <div className="text-center py-10"><p className="text-slate-500">Loading booking details...</p></div>
        ) : !booking ? (
          <div className="text-center py-10"><p className="text-red-500">Booking not found.</p></div>
        ) : !authorized ? (
          <div className="text-center py-10"><p className="text-red-500">You are not authorized to view this booking.</p></div>
        ) : (
          <div className="space-y-6">

            {/* Confirmation Alert */}
            <div className="border border-green-200 rounded-xl p-6 bg-green-50 shadow-md">
              <div className="flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="m9 11 3 3L22 4" /></svg>
                <h1 className="text-2xl font-bold text-green-700">Booking Confirmed!</h1>
              </div>
              <p className="text-green-700 mt-2">Your stay has been successfully requested. You will receive a final email confirmation shortly.</p>
            </div>

            {/* Booking Details Card */}
            <div className="border border-gray-200 rounded-xl p-6 bg-white shadow-lg">
              <h2 className="text-xl font-bold mb-4 text-slate-800">Reservation Summary</h2>

              <div className="grid grid-cols-2 gap-4 text-sm text-slate-700 border-b pb-4 mb-4">
                <p className="font-semibold text-slate-900">Property</p>
                <p className="text-right truncate">{propertyTitle}</p>
              </div>

              <div className="text-sm space-y-3 text-slate-700">

                {/* Dates */}
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium">Check-in Date:</span>
                  <span className="font-semibold">{formatDate(booking.checkInDate)}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium">Check-out Date:</span>
                  <span className="font-semibold">{formatDate(booking.checkOutDate)}</span>
                </div>

                {/* Guests */}
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium">Guests:</span>
                  <span className="font-semibold">{booking.totalGuests}</span>
                </div>

                {/* Total */}
                {booking.totalCost && (
                  <div className="flex justify-between pt-3">
                    <span className="text-lg font-bold">Total Cost:</span>
                    <span className="text-lg font-bold text-primary">
                      ${Number(booking.totalCost).toLocaleString()}
                    </span>
                  </div>
                )}

                {/* Status */}
                <div className="flex justify-between border-t border-gray-100 pt-3">
                  <span className="font-medium">Status:</span>
                  <span className={`font-bold capitalize ${booking.status === 'pending' ? 'text-yellow-600' : 'text-green-600'}`}>
                    {booking.status}
                  </span>
                </div>

              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                onClick={() => router.push('/bookings')}
                className="bg-primary hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors shadow-lg"
              >
                Go to My Bookings
              </button>
              <button
                onClick={() => router.push('/search')}
                className="border border-gray-300 hover:border-gray-400 text-slate-700 px-6 py-3 rounded-xl font-semibold transition-colors"
              >
                Explore More Stays
              </button>
            </div>
          </div>
        )}
      </main>
    </ProtectedRoute>
  );
}
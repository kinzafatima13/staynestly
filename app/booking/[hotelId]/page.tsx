"use client";
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, Calendar, Users, DollarSign, CheckCircle } from 'lucide-react';

export default function BookingPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.id as string;
  
  const [dates, setDates] = useState({
    checkIn: '',
    checkOut: '',
    guests: 1
  });
  
  const handleBooking = () => {
    alert(`Booking confirmed for property ${propertyId}!`);
    // In real app, you would call API here
    router.push('/booking-confirmation');
  };
  
  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Home
        </button>
        
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Booking</h1>
          <p className="text-gray-600 mb-8">Property ID: {propertyId}</p>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Check-in Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="date"
                  value={dates.checkIn}
                  onChange={(e) => setDates({...dates, checkIn: e.target.value})}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Check-out Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="date"
                  value={dates.checkOut}
                  onChange={(e) => setDates({...dates, checkOut: e.target.value})}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Guests
              </label>
              <div className="relative">
                <Users className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={dates.guests}
                  onChange={(e) => setDates({...dates, guests: parseInt(e.target.value)})}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>
            
            <div className="pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-gray-600">Total Price</p>
                  <p className="text-3xl font-bold text-gray-900">$299</p>
                </div>
                <button
                  onClick={handleBooking}
                  className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold px-8 py-3 rounded-lg transition-all flex items-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  Confirm Booking
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
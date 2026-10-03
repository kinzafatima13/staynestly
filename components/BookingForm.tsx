"use client";
import { useState, useEffect } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export default function BookingForm({ hotelId, hotelName, nightlyPrice, user }: any) {
  const router = useRouter();
  
  // 1. Reservation States
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  
  // 2. Bill Calculation States
  const [totalDays, setTotalDays] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  
  // 3. Payment States (Simulation)
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Calculate Bill whenever dates change
  useEffect(() => {
    if (checkIn && checkOut) {
      const start = new Date(checkIn);
      const end = new Date(checkOut);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      
      if (days > 0) {
        setTotalDays(days);
        setTotalPrice(days * nightlyPrice);
      } else {
        setTotalDays(0);
        setTotalPrice(0);
      }
    }
  }, [checkIn, checkOut, nightlyPrice]);

  async function handlePayment(e: React.FormEvent) {
    e.preventDefault();
    setIsProcessing(true);

    if (!user) {
      alert("Please login to book a room");
      router.push('/auth/login');
      return;
    }

    // SIMULATE PAYMENT DELAY (Makes it feel real)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // SAVE TO FIREBASE
    try {
      const ref = await addDoc(collection(db, 'bookings'), {
        userId: user.uid,
        userEmail: user.email,
        propertyId: hotelId,
        propertyTitle: hotelName,
        checkIn,
        checkOut,
        guests,
        totalPrice,
        paymentStatus: 'paid', // Mark as paid immediately
        paymentMethod: 'Credit Card (Simulated)',
        createdAt: serverTimestamp(),
      });

      // Redirect to Success
      router.push(`/my-listings`); 
    } catch (error) {
      console.error("Booking failed:", error);
      alert("Payment failed. Please try again.");
      setIsProcessing(false);
    }
  }

  return (
    <form onSubmit={handlePayment} className="space-y-6">
      
      {/* SECTION 1: DATES & GUESTS */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
        <h3 className="font-bold text-slate-800 mb-3">1. Your Trip</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">Check-in</label>
            <input 
              type="date" 
              required
              className="w-full p-2 border rounded-lg mt-1"
              onChange={(e) => setCheckIn(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">Check-out</label>
            <input 
              type="date" 
              required
              className="w-full p-2 border rounded-lg mt-1"
              onChange={(e) => setCheckOut(e.target.value)}
            />
          </div>
        </div>
        <div className="mt-3">
          <label className="text-xs font-bold text-slate-500 uppercase">Guests</label>
          <input 
            type="number" 
            min="1" 
            max="10" 
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
            className="w-full p-2 border rounded-lg mt-1"
          />
        </div>
      </div>

      {/* SECTION 2: BILL SUMMARY */}
      {totalDays > 0 && (
        <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
          <h3 className="font-bold text-orange-800 mb-2">2. Price Details</h3>
          <div className="flex justify-between text-slate-600 text-sm mb-1">
            <span>${nightlyPrice} x {totalDays} nights</span>
            <span>${totalPrice}</span>
          </div>
          <div className="flex justify-between text-slate-600 text-sm mb-1">
            <span>Cleaning Fee</span>
            <span>$20</span>
          </div>
          <div className="border-t border-orange-200 mt-2 pt-2 flex justify-between font-bold text-lg text-slate-800">
            <span>Total</span>
            <span>${totalPrice + 20}</span>
          </div>
        </div>
      )}

      {/* SECTION 3: PAYMENT DETAILS */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-3">3. Payment</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-500">Card Number</label>
            <input 
              type="text" 
              placeholder="0000 0000 0000 0000"
              maxLength={19}
              className="w-full p-2 border rounded-lg mt-1 font-mono"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500">Expiry</label>
              <input 
                type="text" 
                placeholder="MM/YY"
                maxLength={5}
                className="w-full p-2 border rounded-lg mt-1 font-mono"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500">CVC</label>
              <input 
                type="text" 
                placeholder="123"
                maxLength={3}
                className="w-full p-2 border rounded-lg mt-1 font-mono"
                value={cvc}
                onChange={(e) => setCvc(e.target.value)}
                required
              />
            </div>
          </div>
        </div>
      </div>

      {/* SUBMIT BUTTON */}
      <button 
        type="submit"
        disabled={isProcessing || totalDays <= 0}
        className={`w-full py-4 rounded-xl font-bold text-white text-lg transition shadow-lg ${
          isProcessing || totalDays <= 0 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-orange-600 hover:bg-orange-700 hover:scale-[1.02]'
        }`}
      >
        {isProcessing ? 'Processing Payment...' : `Pay $${totalPrice + 20}`}
      </button>
      
      <p className="text-xs text-center text-slate-400">
        This is a secure 256-bit SSL encrypted payment.
      </p>
    </form>
  );
}
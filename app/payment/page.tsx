"use client";
import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CreditCard, Calendar, Lock, ArrowRight, CheckCircle, ShieldCheck } from 'lucide-react';

// We wrap the content in Suspense because useSearchParams causes a build error if not wrapped
export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="p-20 text-center">Loading secure checkout...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [isProcessing, setIsProcessing] = useState(false);

  // 1. Retrieve Booking Data from URL
  const propertyTitle = searchParams.get('title') || "Selected Property";
  const pricePerNight = Number(searchParams.get('price')) || 0;
  const checkIn = searchParams.get('checkin') || "Select Date";
  const checkOut = searchParams.get('checkout') || "Select Date";

  // 2. Calculate Totals (Basic Logic)
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  // Default to 1 night if dates are invalid
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const nights = !isNaN(diffTime) ? Math.ceil(diffTime / (1000 * 60 * 60 * 24)) : 1; 
  const subtotal = pricePerNight * (nights === 0 ? 1 : nights);
  const serviceFee = 40; // Flat fee for demo
  const total = subtotal + serviceFee;

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    // SIMULATE PAYMENT PROCESS
    setTimeout(() => {
      alert(`Payment of $${total} Successful! Booking Confirmed.`);
      setIsProcessing(false);
      router.push('/'); // Redirect to Home or My Bookings
    }, 2000);
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-5xl mx-auto px-6">
        
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Confirm and Pay</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* --- LEFT COLUMN: Payment Form --- */}
          <div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600"/> Payment Method
              </h2>
              
              <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg mb-6">
                <Lock className="w-4 h-4" />
                <span className="font-medium">Payments are secure and encrypted</span>
              </div>

              <form onSubmit={handlePay} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Card Number</label>
                  <input type="text" placeholder="0000 0000 0000 0000" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Expiration</label>
                    <input type="text" placeholder="MM/YY" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">CVV</label>
                    <input type="text" placeholder="123" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
                  </div>
                </div>
                
                <button 
                  type="submit" 
                  disabled={isProcessing}
                  className={`w-full mt-4 py-4 rounded-xl font-bold text-white text-lg transition-all ${
                    isProcessing ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-blue-500/30'
                  }`}
                >
                  {isProcessing ? 'Processing...' : `Pay $${total.toLocaleString()}`}
                </button>
              </form>
            </div>
          </div>

          {/* --- RIGHT COLUMN: Booking Summary --- */}
          <div>
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 sticky top-10">
              <h2 className="text-lg font-bold text-slate-800 mb-4 border-b pb-4">Your Booking</h2>
              
              <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-900 mb-1">{propertyTitle}</h3>
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                   <ShieldCheck className="w-4 h-4 text-green-500"/> Great choice!
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center text-slate-700">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400"/> Dates
                  </div>
                  <div className="font-medium text-right">
                    {checkIn} <br/> <span className="text-xs text-slate-400">to</span> <br/> {checkOut}
                  </div>
                </div>
              </div>

              <div className="border-t border-dashed border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>${pricePerNight} x {nights} nights</span>
                  <span>${subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Cleaning & Service Fee</span>
                  <span>${serviceFee}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-slate-900 pt-2 mt-2 border-t border-gray-100">
                  <span>Total (USD)</span>
                  <span>${total.toLocaleString()}</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
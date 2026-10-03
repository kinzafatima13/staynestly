// app/checkout/[id]/page.tsx
"use client";
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { CreditCard, Calendar, User, CheckCircle, Lock, ArrowRight } from 'lucide-react';

// --- Mock Data Placeholder ---
// In a real app, you would fetch this data based on the propertyId
const MOCK_PROPERTY_DATA = {
    title: "The Signature Skyloft Apartment",
    city: "San Francisco",
    nights: 3,
    pricePerNight: 289,
    image: "/mock-apartment-image.jpg"
};
const subtotal = MOCK_PROPERTY_DATA.nights * MOCK_PROPERTY_DATA.pricePerNight;
const serviceFee = subtotal * 0.1;
const tax = subtotal * 0.05;
const totalPrice = subtotal + serviceFee + tax;
// ----------------------------

export default function CheckoutPage() {
    const params = useParams();
    const propertyId = params.id as string;
    const [isProcessing, setIsProcessing] = useState(false);

    const handleBooking = () => {
        setIsProcessing(true);
        // --- Placeholder for actual payment gateway integration ---
        setTimeout(() => {
            alert("Booking Confirmed!");
            setIsProcessing(false);
            // router.push(`/confirmation/${propertyId}`); // Navigate to a confirmation page
        }, 1500);
    };

    return (
        <main className="bg-gray-50 py-16 min-h-screen">
            <div className="max-w-7xl mx-auto px-6">
                
                {/* --- HEADER --- */}
                <h1 className="text-5xl font-extrabold text-slate-800 tracking-tight mb-4">
                    Complete Your Stay
                </h1>
                <p className="text-xl text-slate-500 mb-12">
                    You're one step away from confirming your reservation.
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    
                    {/* --- COLUMN 1: BOOKING DETAILS & PAYMENT FORM (2/3 width) --- */}
                    <div className="lg:col-span-2 space-y-10">
                        
                        {/* 1. Guest Information */}
                        <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
                            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                                <User className="w-6 h-6 text-primary"/> Guest Details
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Input fields would go here (Name, Email, Phone) */}
                                <input type="text" placeholder="Full Name" className="p-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"/>
                                <input type="email" placeholder="Email Address" className="p-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"/>
                                {/* Add more inputs as needed */}
                            </div>
                        </div>

                        {/* 2. Payment Method */}
                        <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
                            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                                <CreditCard className="w-6 h-6 text-primary"/> Payment Method
                            </h2>
                            <div className="flex items-center text-green-600 mb-4">
                                <Lock className="w-4 h-4 mr-2"/>
                                <span className="text-sm font-medium">100% Secure Transaction via Stripe/PayPal</span>
                            </div>
                            {/* Placeholder for payment fields (Card Number, Expiry, CVC) */}
                            <div className="space-y-4">
                                <input type="text" placeholder="Card Number" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"/>
                                <div className="grid grid-cols-3 gap-4">
                                    <input type="text" placeholder="MM/YY" className="p-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary col-span-2"/>
                                    <input type="text" placeholder="CVC" className="p-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"/>
                                </div>
                            </div>
                        </div>
                        
                    </div>
                    
                    {/* --- COLUMN 2: BOOKING SUMMARY (1/3 width) --- */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-6 bg-white p-6 rounded-2xl shadow-2xl border border-primary/20">
                            
                            <h3 className="text-xl font-bold text-slate-800 mb-4 border-b pb-2">
                                Booking Summary
                            </h3>
                            
                            {/* Property Info */}
                            <div className="flex items-center gap-4 mb-6">
                                {/* Replace with an actual Next/Image component */}
                                <div className="w-20 h-16 bg-gray-200 rounded-lg flex-shrink-0" style={{ backgroundImage: `url(${MOCK_PROPERTY_DATA.image})`, backgroundSize: 'cover' }} /> 
                                <div>
                                    <p className="font-semibold text-lg line-clamp-1">{MOCK_PROPERTY_DATA.title}</p>
                                    <p className="text-sm text-slate-500 flex items-center gap-1">
                                        <Calendar className="w-3 h-3"/> {MOCK_PROPERTY_DATA.nights} Nights
                                    </p>
                                </div>
                            </div>

                            {/* Price Breakdown */}
                            <div className="space-y-3 pb-4 border-b border-gray-200">
                                <div className="flex justify-between text-slate-600">
                                    <span>{MOCK_PROPERTY_DATA.pricePerNight.toFixed(0)} x {MOCK_PROPERTY_DATA.nights} nights</span>
                                    <span>${subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-slate-600">
                                    <span>Service Fee (10%)</span>
                                    <span>${serviceFee.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-slate-600">
                                    <span>Tax</span>
                                    <span>${tax.toFixed(2)}</span>
                                </div>
                            </div>
                            
                            {/* Total */}
                            <div className="flex justify-between items-center pt-4">
                                <span className="text-xl font-bold text-slate-800">Total Due</span>
                                <span className="text-3xl font-extrabold text-primary">${totalPrice.toFixed(2)}</span>
                            </div>

                            {/* Confirmation Button */}
                            <button 
                                onClick={handleBooking}
                                disabled={isProcessing}
                                className={`w-full mt-6 flex items-center justify-center gap-2 font-bold py-4 rounded-xl transition-all ${
                                    isProcessing ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary hover:bg-orange-600 text-white shadow-lg shadow-primary/30'
                                }`}
                            >
                                {isProcessing ? (
                                    'Processing...'
                                ) : (
                                    <>
                                        Confirm and Pay <ArrowRight className="w-5 h-5"/>
                                    </>
                                )}
                            </button>

                            <div className="text-center text-xs text-slate-500 mt-3 flex items-center justify-center gap-1">
                                <CheckCircle className="w-3 h-3 text-green-500"/>
                                You will receive an email confirmation immediately.
                            </div>
                        </div>
                    </div>
                </div>
                
                <p className="mt-16 text-center text-sm text-slate-400">
                    Property ID being checked out: {propertyId}
                </p>
            </div>
        </main>
    );
}
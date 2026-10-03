// components/BookingWidget.tsx
"use client";

import { useRouter } from 'next/navigation';

interface BookingWidgetProps {
    propertyId: string;
    price: number;
}

export default function BookingWidget({ propertyId, price }: BookingWidgetProps) {
    const router = useRouter();

    const handleBookNow = () => {
        // Debugging: Check if ID exists
        if (!propertyId) {
            alert("Error: Property ID is missing. Cannot proceed to checkout.");
            console.error("BookingWidget: propertyId is undefined");
            return;
        }

        console.log("Navigating to checkout for property:", propertyId);
        
        // Force navigation to the checkout page
        // Using window.location.href acts as a fallback if the Next.js router is stuck
        window.location.href = `/checkout/${propertyId}`;
    };

    return (
        <div className="p-6 bg-white rounded-xl shadow-lg border border-gray-100 sticky top-24">
            <div className="flex justify-between items-end mb-4">
                <div>
                    <p className="text-sm text-slate-500">Starting from</p>
                    <p className="text-3xl font-bold text-slate-800">
                        ${price.toFixed(0)} <span className="text-sm font-normal text-slate-500">/ night</span>
                    </p>
                </div>
            </div>
            
            <button 
                type="button"
                onClick={handleBookNow}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95 text-lg"
            >
                Book Now
            </button>
            
            <p className="text-xs text-center text-slate-400 mt-3">
                You won't be charged yet.
            </p>
        </div>
    );
}
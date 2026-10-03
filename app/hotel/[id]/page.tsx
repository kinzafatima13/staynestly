"use client";
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MapPin, Star, Wifi, Coffee, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// --- HARDCODED MOCK DATA FOR FALLBACK ---
const MOCK_PROPERTIES = [
  {
    id: '1',
    title: 'Luxury Ocean Villa',
    city: 'Malibu, CA',
    price: 350,
    rating: 4.9,
    description: "Experience the ultimate beachfront luxury. This villa features panoramic ocean views, a private infinity pool, and direct access to the sand.",
    images: ['https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&q=80&w=1200'],
    amenities: ['Free Wi-Fi', 'Ocean View', 'Private Pool', 'King Bed', 'Kitchen']
  },
  {
    id: '2',
    title: 'Cozy Mountain Cabin',
    city: 'Aspen, CO',
    price: 180,
    rating: 4.7,
    description: "Escape to the mountains in this charming timber cabin. Includes a stone fireplace, hot tub under the stars, and easy access to hiking trails.",
    images: ['https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=1200'],
    amenities: ['Fireplace', 'Hot Tub', 'Hiking Trails', 'Parking', 'Heater']
  },
  {
    id: '3',
    title: 'Modern City Apartment',
    city: 'New York, NY',
    price: 220,
    rating: 4.5,
    description: "Stay in the heart of the city. This modern loft offers skyline views, smart home features, and is walking distance to the best coffee shops.",
    images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=1200'],
    amenities: ['City View', 'Smart TV', 'Gym Access', 'Concierge', 'Subway Access']
  }
];

export default function PropertyDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Default dates
  const [checkIn, setCheckIn] = useState(new Date().toISOString().split('T')[0]);
  const [checkOut, setCheckOut] = useState(
    new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  useEffect(() => {
    const fetchProperty = async () => {
      setLoading(true);
      try {
        // Try to fetch from Firestore
        const docRef = doc(db, 'properties', params.id as string);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setProperty({ id: docSnap.id, ...docSnap.data() });
        } else {
          // Fallback to mock data
          const found = MOCK_PROPERTIES.find(p => p.id === params.id);
          setProperty(found || null);
        }
      } catch (error) {
        console.error('Error fetching property:', error);
        // Fallback to mock data on error
        const found = MOCK_PROPERTIES.find(p => p.id === params.id);
        setProperty(found || null);
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [params.id]);

  const calculateTotal = () => {
      if (!property) return 0;
      const start = new Date(checkIn);
      const end = new Date(checkOut);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1; 
      const pricePerNight = property.pricePerNight || property.price || 0;
      return diffDays * pricePerNight;
  };

  // --- NAVIGATION LOGIC ---
  const handleBookNow = () => {
      console.log("Book Now Clicked for property:", property?.id); // Debug log
      
      if (!property?.id) {
          alert("Error: Property ID not found");
          return;
      }
      
      // Use window.location.href for a hard navigation to ensure it works
      const checkoutUrl = `/checkout/${property.id}`;
      window.location.href = checkoutUrl;
  };

  if (loading) return (
    <div className="p-20 text-center text-slate-500">
      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-orange-600" />
      <p>Loading property details...</p>
    </div>
  );
  if (!property) return <div className="p-20 text-center">Property not found</div>;

  const displayImage = property.images && property.images.length > 0 ? property.images[0] : '/placeholder-hotel.jpg';
  
  // Handle amenities - convert object to array if needed
  let displayAmenities = ['Wifi', 'Parking', 'Kitchen'];
  if (property.amenities) {
    if (Array.isArray(property.amenities)) {
      displayAmenities = property.amenities;
    } else if (typeof property.amenities === 'object') {
      // Convert object {wifi: true, parking: false} to array ['Wifi']
      displayAmenities = Object.entries(property.amenities)
        .filter(([_, value]) => value === true)
        .map(([key]) => {
          // Convert camelCase to Title Case
          return key
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
        });
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 sticky top-0 z-20 shadow-sm flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-600 hover:text-orange-600 font-medium transition">
          <ArrowLeft className="w-5 h-5" /> Back to Search
        </Link>
      </div>

      {/* Hero Image */}
      <div className="relative h-[400px] md:h-[500px] w-full bg-gray-200">
        <img src={displayImage} alt={property.title} className="w-full h-full object-cover"/>
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
        <div className="absolute bottom-6 left-6 md:left-12 text-white max-w-4xl">
             <h1 className="text-4xl md:text-5xl font-extrabold shadow-sm leading-tight">{property.title}</h1>
             <p className="flex items-center gap-2 mt-3 text-xl opacity-90 font-medium">
                <MapPin className="w-5 h-5 text-orange-400" /> {property.location || property.city || 'Unknown Location'}
             </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-12">
        
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-2xl font-bold text-slate-800 mb-4">About this stay</h2>
                <p className="text-slate-600 leading-relaxed text-lg">{property.description || "No description provided."}</p>
                <div className="mt-8 flex items-center gap-6 pt-6 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-slate-800 font-bold text-lg">
                        <Star className="fill-yellow-400 text-yellow-400 w-6 h-6" /> {property.rating || 5.0}
                    </div>
                    <div className="text-slate-300">|</div>
                    <div className="text-slate-500 font-medium">
                      {property.maxGuests || 2} Guests • {property.bedrooms || 1} Bedroom{property.bedrooms > 1 ? 's' : ''} • {property.bathrooms || 1} Bath{property.bathrooms > 1 ? 's' : ''}
                    </div>
                </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-xl font-bold text-slate-800 mb-6">What this place offers</h3>
                <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                    {displayAmenities.map((item: string, i: number) => (
                        <div key={i} className="flex items-center gap-3 text-slate-600 font-medium">
                            <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
                                {i % 2 === 0 ? <Wifi className="w-5 h-5"/> : <Coffee className="w-5 h-5"/>}
                            </div>
                            {item}
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* Right Column: Booking Card */}
        <div className="relative">
            <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200 sticky top-28">
                <div className="flex justify-between items-end mb-6">
                    <div>
                        <span className="text-3xl font-bold text-slate-900">${property.pricePerNight || property.price || 0}</span>
                        <span className="text-slate-500 font-medium"> / night</span>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                        <div className="border border-gray-300 rounded-lg p-3 cursor-pointer">
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Check-in</label>
                            <input 
                                type="date" 
                                value={checkIn}
                                onChange={(e) => setCheckIn(e.target.value)}
                                className="w-full text-sm outline-none text-slate-900 font-medium bg-transparent"
                            />
                        </div>
                        <div className="border border-gray-300 rounded-lg p-3 cursor-pointer">
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Check-out</label>
                            <input 
                                type="date" 
                                value={checkOut}
                                onChange={(e) => setCheckOut(e.target.value)}
                                className="w-full text-sm outline-none text-slate-900 font-medium bg-transparent"
                            />
                        </div>
                    </div>
                    
                    {/* --- FIXED BOOK BUTTON --- */}
                    <button 
                        type="button" // Explicitly set type to button to prevent form submission issues
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-orange-500/30 text-lg active:scale-95"
                        onClick={handleBookNow}
                    >
                        Book Now
                    </button>
                    
                    <div className="pt-4 mt-4 border-t flex justify-between items-center text-slate-800">
                        <span className="underline decoration-slate-300 underline-offset-4">Total before taxes</span>
                        <span className="font-bold text-xl">${calculateTotal()}</span>
                    </div>
                </div>
            </div>
        </div>

      </div>
    </main>
  );
}
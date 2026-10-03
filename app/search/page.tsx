"use client";
import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import HotelCard from '@/components/HotelCard';
import Link from 'next/link';
import { ArrowLeft, SearchX, Loader2 } from 'lucide-react';
import SearchBar from '@/components/SearchBar';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// --- HARDCODED DATA FOR FALLBACK ---
const MOCK_PROPERTIES = [
  {
    id: '1',
    title: 'Luxury Ocean Villa',
    city: 'Malibu, CA',
    price: 350,
    rating: 4.9,
    images: ['https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&q=80&w=800'],
  },
  {
    id: '2',
    title: 'Cozy Mountain Cabin',
    city: 'Aspen, CO',
    price: 180,
    rating: 4.7,
    images: ['https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=800'],
  },
  {
    id: '3',
    title: 'Modern City Apartment',
    city: 'New York, NY',
    price: 220,
    rating: 4.5,
    images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=800'],
  }
];

function SearchResults() {
  const searchParams = useSearchParams();
  
  const query = searchParams.get('city') || searchParams.get('location') || ''; 
  
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      try {
        // Fetch from Firestore
        const propertiesRef = collection(db, 'properties');
        const snapshot = await getDocs(propertiesRef);
        
        let allProperties = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Add mock properties as fallback
        if (allProperties.length === 0) {
          allProperties = MOCK_PROPERTIES;
        }

        // Filter by query if provided
        if (query) {
          const lowerQuery = query.toLowerCase().trim();
          allProperties = allProperties.filter((p: any) => 
            p.city?.toLowerCase().includes(lowerQuery) || 
            p.title?.toLowerCase().includes(lowerQuery)
          );
        }

        setResults(allProperties);
      } catch (error) {
        console.error('Error fetching properties:', error);
        // Fallback to mock data on error
        setResults(MOCK_PROPERTIES);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [query]);

  return (
    <div>
        <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-800">
                {query 
                    ? `Stays in "${query}"` 
                    : "All Available Stays"}
            </h1>
            <p className="text-slate-500 mt-2">
                Found {results.length} {results.length === 1 ? 'property' : 'properties'}
            </p>
        </div>

        {loading ? (
             <div className="p-10 text-center">
               <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-orange-600" />
               <p className="text-slate-600">Searching properties...</p>
             </div>
        ) : results.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {results.map((p) => (
                    <HotelCard 
                        key={p.id}
                        id={p.id} 
                        title={p.title} 
                        city={p.city} 
                        price={p.price} 
                        rating={p.rating} 
                        image={p.images?.[0]} 
                    />
                ))}
            </div>
        ) : (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                <div className="flex justify-center mb-4">
                    <SearchX className="w-16 h-16 text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-700">No matches found</h3>
                <p className="text-slate-500 mt-2 mb-6">Try checking your spelling or search for a different city.</p>
                <Link href="/" className="px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700">
                    See All Properties
                </Link>
            </div>
        )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <main className="min-h-screen bg-gray-50 pt-24 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
            <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 transition">
                <ArrowLeft className="w-5 h-5"/> Back to Home
            </Link>
        </div>

        <div className="mb-10 p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
             <Suspense fallback={<div className="h-16 bg-gray-100 rounded-xl animate-pulse"></div>}>
               <SearchBar />
             </Suspense>
        </div>

        <Suspense fallback={<div>Loading search...</div>}>
            <SearchResults />
        </Suspense>

      </div>
    </main>
  );
}
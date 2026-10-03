// components/HotelCard.tsx

import Link from 'next/link';
import Image from 'next/image';
import { Star } from 'lucide-react';

// --- FIX: Define the required props interface for type checking ---
interface HotelCardProps {
    id: string;
    title: string;
    city: string;
    price: number;
    rating: number;
    image?: string; // image is optional as it might be undefined/null in the DB
}
// -------------------------------------------------------------------

export default function HotelCard({ 
    id, 
    title, 
    city, 
    price, 
    rating, 
    image 
}: HotelCardProps) {
    
    return (
        <Link 
            href={`/hotel/${id}`} 
            className="block rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300 bg-white"
        >
            <div className="relative h-48">
                {/* Ensure the Image component is handled safely */}
                <Image 
                    // Use a placeholder if the image URL is missing
                    src={image || '/placeholder-hotel.jpg'} 
                    alt={title} 
                    fill 
                    style={{ objectFit: 'cover' }} 
                    // Optimization: Define sizes for better performance
                    sizes="(max-width: 768px) 100vw, 33vw"
                />
            </div>
            <div className="p-4">
                <h3 className="text-xl font-bold text-slate-800 truncate">{title}</h3>
                <p className="text-sm text-slate-500">{city}</p>
                
                <div className="flex justify-between items-center pt-3 mt-3 border-t">
                    {/* Rating Display */}
                    <div className="flex items-center text-sm font-semibold text-yellow-600">
                        <Star className="w-4 h-4 mr-1 fill-yellow-500 text-yellow-500"/>
                        {/* Format rating to one decimal place */}
                        {rating.toFixed(1)}
                    </div>
                    
                    {/* Price Display */}
                    <p className="text-lg font-bold text-primary">
                        ${price.toLocaleString()}
                    </p>
                </div>
            </div>
        </Link>
    );
}
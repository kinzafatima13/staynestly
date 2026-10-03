"use client";
import SearchBar from '@/components/SearchBar';
import { useState, useEffect, Suspense } from 'react';
import HotelCard from '@/components/HotelCard';
import Reveal from '@/components/Reveal';
import { Users, ArrowRight, MapPin, Star, ChevronRight, Menu, User, X, Home, MessageCircle, Search, Users as UsersIcon, Info, Phone, Loader2 } from 'lucide-react';
import ChatbotWidget from '@/components/ChatbotWidget';
import { collection, getDocs, query, limit, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

interface Property {
  id: string;
  title: string;
  description: string;
  city: string;
  price: number;
  rating: number;
  originalPrice?: number;
  images?: string[];
  lat?: number;
  lng?: number;
  isFeatured?: boolean;
  isNearby?: boolean;
  reviews?: number;
}

// Mock data - ONLY FRONTEND
const MOCK_NEARBY_PROPERTIES: Property[] = [
  {
    id: 'nearby1',
    title: 'Eoser Towlient',
    description: 'Modern apartment with stunning city views and all amenities',
    city: 'New York, NY',
    price: 140,
    rating: 4.5,
    originalPrice: 199,
    images: ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=800'],
    lat: 40.7128,
    lng: -74.0060,
    isNearby: true,
    reviews: 128
  },
  {
    id: 'nearby2',
    title: 'Eose1Ten Trow Bilen',
    description: 'Spacious luxury villa with private pool and garden',
    city: 'Los Angeles, CA',
    price: 220,
    rating: 4.8,
    originalPrice: 960,
    images: ['https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&q=80&w=800'],
    lat: 34.0522,
    lng: -118.2437,
    isNearby: true,
    reviews: 89
  },
  {
    id: 'nearby3',
    title: 'Urban Studio Loft',
    description: 'Cozy studio in the heart of downtown',
    city: 'Chicago, IL',
    price: 95,
    rating: 4.3,
    originalPrice: 120,
    images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&q=80&w=800'],
    lat: 41.8781,
    lng: -87.6298,
    isNearby: true,
    reviews: 67
  },
  {
    id: 'nearby4',
    title: 'Beachfront Bungalow',
    description: 'Direct beach access with sunset views',
    city: 'Miami, FL',
    price: 180,
    rating: 4.7,
    originalPrice: 250,
    images: ['https://images.unsplash.com/photo-1516455590571-18256e5bb9ff?auto=format&fit=crop&q=80&w=800'],
    lat: 25.7617,
    lng: -80.1918,
    isNearby: true,
    reviews: 203
  }
];

const MOCK_FEATURED_PROPERTIES: Property[] = [
  {
    id: 'featured1',
    title: 'Eoser Trow Bilen',
    description: 'Luxury apartment with premium amenities and concierge service',
    city: 'San Francisco, CA',
    price: 120,
    rating: 4.9,
    originalPrice: 800,
    images: ['https://images.unsplash.com/photo-1613977257592-4871e5fcd7c4?auto=format&fit=crop&q=80&w=800'],
    isFeatured: true,
    reviews: 156
  },
  {
    id: 'featured2',
    title: 'Modern Beach House',
    description: 'Beachfront property with panoramic ocean views',
    city: 'Malibu, CA',
    price: 150,
    rating: 4.7,
    originalPrice: 800,
    images: ['https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&q=80&w=800'],
    isFeatured: true,
    reviews: 203
  },
  {
    id: 'featured3',
    title: 'Ease1 Frod Elien',
    description: 'Mountain cabin with fireplace and hiking trails',
    city: 'Aspen, CO',
    price: 150,
    rating: 4.8,
    originalPrice: 900,
    images: ['https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?auto=format&fit=crop&q=80&w=800'],
    isFeatured: true,
    reviews: 134
  },
  {
    id: 'featured4',
    title: 'City Penthouse',
    description: 'Top floor penthouse with skyline views',
    city: 'Las Vegas, NV',
    price: 125,
    rating: 4.6,
    originalPrice: 600,
    images: ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=800'],
    isFeatured: true,
    reviews: 98
  },
  {
    id: 'featured5',
    title: 'Lakeside Retreat',
    description: 'Private cabin on the lake with fishing dock',
    city: 'Lake Tahoe, CA',
    price: 175,
    rating: 4.9,
    originalPrice: 750,
    images: ['https://images.unsplash.com/photo-1513584684374-8bab748fbf90?auto=format&fit=crop&q=80&w=800'],
    isFeatured: true,
    reviews: 89
  },
  {
    id: 'featured6',
    title: 'Historic Townhouse',
    description: 'Renovated historic home in the city center',
    city: 'Boston, MA',
    price: 135,
    rating: 4.5,
    originalPrice: 700,
    images: ['https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&q=80&w=800'],
    isFeatured: true,
    reviews: 112
  }
];

export default function HomePage() {
  const [nearbyProperties, setNearbyProperties] = useState<Property[]>([]);
  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, role, logout } = useAuth();

  // Calculate distance between two points using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10; // Round to 1 decimal place
  };

  // Fetch properties from Firestore
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);

        // Get user location first
        let location = { lat: 40.7128, lng: -74.0060 }; // Default NYC
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            if (typeof window !== 'undefined' && navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
            } else {
              reject(new Error('Geolocation not available'));
            }
          });
          location = { lat: position.coords.latitude, lng: position.coords.longitude };
        } catch (geoError) {
          console.log('Using default location:', geoError);
        }
        setUserLocation(location);

        // Fetch all properties from Firestore
        const propertiesQuery = query(collection(db, 'properties'), limit(20));
        const querySnapshot = await getDocs(propertiesQuery);

        const properties: Property[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const lat = data.lat || data.latitude;
          const lng = data.lng || data.longitude;

          properties.push({
            id: doc.id,
            title: data.title || '',
            description: data.description || '',
            city: data.city || data.location || '',
            price: data.price || data.pricePerNight || 0,
            rating: data.rating || 4.5,
            images: data.images || [data.imageUrl] || [],
            isFeatured: data.isFeatured || false,
            reviews: data.reviews || data.reviewCount || 0,
            originalPrice: data.originalPrice || undefined,
            lat: lat,
            lng: lng,
            isNearby: lat && lng // Mark as nearby if has coordinates
          });
        });

        // If Firestore has properties, use them; otherwise use mock data
        if (properties.length > 0) {
          // Calculate distances and sort nearby properties
          const propertiesWithDistance = properties.map(p => ({
            ...p,
            distance: p.lat && p.lng
              ? calculateDistance(location.lat, location.lng, p.lat, p.lng)
              : 9999
          }));

          // Sort by distance for nearby, take closest 4
          const sortedByDistance = [...propertiesWithDistance].sort((a, b) => a.distance - b.distance);
          const nearby = sortedByDistance.slice(0, 4);

          // Get featured properties
          const featured = properties.filter(p => p.isFeatured).slice(0, 6);

          setNearbyProperties(nearby.length > 0 ? nearby : properties.slice(0, 4));
          setFeaturedProperties(featured.length > 0 ? featured : properties.slice(0, 6));
        } else {
          // Fallback to mock data if Firestore is empty
          setNearbyProperties(MOCK_NEARBY_PROPERTIES.slice(0, 4));
          setFeaturedProperties(MOCK_FEATURED_PROPERTIES.slice(0, 6));
        }
      } catch (error) {
        console.error('Error fetching properties:', error);
        // Fallback to mock data on error
        setNearbyProperties(MOCK_NEARBY_PROPERTIES.slice(0, 4));
        setFeaturedProperties(MOCK_FEATURED_PROPERTIES.slice(0, 6));
        setUserLocation({ lat: 40.7128, lng: -74.0060 });
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  // Simulate map functionality - FRONTEND ONLY
  const simulateMapView = () => {
    if (userLocation) {
      const mapUrl = `https://www.google.com/maps?q=${userLocation.lat},${userLocation.lng}&z=12`;
      window.open(mapUrl, '_blank');
    }
  };

  // Mobile menu items exactly as requested
  const mobileMenuItems = [
    { icon: <Search className="w-5 h-5" />, label: "Find A Stay", href: "/search" }, // Corrected href from /find-stay to /search based on Navbar
    { icon: <Home className="w-5 h-5" />, label: "Share A Stay", href: "/share-stay" },
    { icon: <UsersIcon className="w-5 h-5" />, label: "Find A Roommate", href: "/find-roommate" },
    { icon: <Info className="w-5 h-5" />, label: "About Us", href: "/about" },
    { icon: <Phone className="w-5 h-5" />, label: "Contact Us", href: "/contact" },
    ...(role === 'host' ? [{ icon: <MessageCircle className="w-5 h-5" />, label: "Dashboard", href: "/dashboard" }] : []),
  ];

  // Profile menu items exactly as requested
  const profileMenuItems = [
    { label: "View Profile", href: "/profile" },
    ...(role === 'host' ? [{ label: "My Listings", href: "/my-listings" }] : []),
    { label: "Account Settings", href: "/account-settings" },
    { label: "Logout", href: "/logout", isLogout: true },
  ];

  return (
    <main className="bg-white min-h-screen">
      {/* Header with Logo and Navigation */}
      <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">S</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">STAYNESTLY</h1>
                <p className="text-xs text-gray-500 -mt-1">Discover Your Sanctuary</p>
              </div>
            </div>

            {/* Desktop Navigation - Hidden on mobile */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="/search" className="text-gray-700 hover:text-orange-500 font-medium transition-colors">
                Find A Stay
              </a>
              <a href="/share-stay" className="text-gray-700 hover:text-orange-500 font-medium transition-colors">
                Share A Stay
              </a>
              <a href="/find-roommate" className="text-gray-700 hover:text-orange-500 font-medium transition-colors">
                Find A Roommate
              </a>
              {role === 'host' && (
                <a href="/dashboard" className="text-gray-700 hover:text-orange-500 font-medium transition-colors">
                  Dashboard
                </a>
              )}
            </nav>

            {/* Right side buttons */}
            <div className="flex items-center space-x-4">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Menu"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>

              {/* Profile Menu */}
              <div className="relative">
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-9 h-9 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-700" />
                  </div>
                  <span className="hidden md:inline text-gray-700 font-medium">Profile</span>
                </button>

                {/* Profile Dropdown */}
                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border py-2 z-50 animate-in fade-in slide-in-from-top-2">
                    {user ? (
                      <>
                        <a
                          href="/profile"
                          className="block px-4 py-3 hover:bg-gray-50 transition-colors text-gray-700"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          View Profile
                        </a>
                        <a
                          href="/account-settings"
                          className="block px-4 py-3 hover:bg-gray-50 transition-colors text-gray-700"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          Account Settings
                        </a>
                        {role === 'host' && (
                          <a
                            href="/my-listings"
                            className="block px-4 py-3 hover:bg-gray-50 transition-colors text-gray-700"
                            onClick={() => setIsProfileMenuOpen(false)}
                          >
                            My Listings
                          </a>
                        )}
                        <button
                          onClick={() => {
                            setIsProfileMenuOpen(false);
                            logout();
                          }}
                          className="block w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors text-red-600 hover:text-red-700"
                        >
                          Logout
                        </button>
                      </>
                    ) : (
                      <>
                        <a
                          href="/auth/login"
                          className="block px-4 py-3 hover:bg-gray-50 transition-colors text-gray-700"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          Login
                        </a>
                        <a
                          href="/auth/signup"
                          className="block px-4 py-3 hover:bg-gray-50 transition-colors text-orange-600 font-medium"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          Sign Up
                        </a>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Menu Dropdown */}
          {isMenuOpen && (
            <div className="md:hidden mt-4 pb-4 border-t pt-4 animate-in slide-in-from-top">
              <div className="space-y-2">
                {mobileMenuItems.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.icon}
                    <span className="font-medium">{item.label}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section
        className="relative h-[500px] md:h-[600px] flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage: "linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&q=80&w=2000')",
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="container mx-auto px-4 relative z-10 text-center">
          <Reveal delay={0.1}>
            <div className="space-y-6 max-w-3xl mx-auto">
              <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight">
                Your Next <span className="text-orange-400">Adventure</span><br />Starts Here
              </h1>
              <p className="text-xl text-gray-200 md:text-2xl">
                Discover curated homes, unique stays, and unbeatable deals across the globe
              </p>
              <div className="pt-4">
                <Suspense fallback={<div className="h-20 bg-white/10 rounded-xl animate-pulse"></div>}>
                  <SearchBar />
                </Suspense>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* EXPLORE Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <Reveal>
            <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">EXPLORE</h2>
          </Reveal>

          {/* Nearby Stays */}
          <div className="mb-16">
            <Reveal>
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold text-gray-900">Nearby Stays</h3>
                <button
                  onClick={simulateMapView}
                  className="flex items-center text-orange-500 hover:text-orange-600 font-medium"
                >
                  <MapPin className="w-5 h-5 mr-2" />
                  View on Map
                </button>
              </div>
            </Reveal>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                // Loading skeleton
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 animate-pulse">
                    <div className="h-48 bg-gray-200"></div>
                    <div className="p-6">
                      <div className="h-6 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded mb-4 w-3/4"></div>
                      <div className="flex items-center justify-between">
                        <div className="h-8 bg-gray-200 rounded w-20"></div>
                        <div className="h-10 bg-gray-200 rounded w-24"></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : nearbyProperties.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <p className="text-gray-500 text-lg">No nearby properties found. Add some properties to see them here!</p>
                </div>
              ) : (
                nearbyProperties.map((property, index) => (
                  <Reveal key={property.id} delay={0.1 * index}>
                    <Link href={`/hotel/${property.id}`} className="block">
                      <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 cursor-pointer">
                        <div className="relative h-48">
                          <img
                            src={property.images?.[0]}
                            alt={property.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg">
                            <div className="flex items-center space-x-1">
                              <Star className="w-4 h-4 text-yellow-500 fill-current" />
                              <span className="font-semibold">{property.rating}</span>
                            </div>
                          </div>
                        </div>
                        <div className="p-6">
                          <h4 className="text-xl font-bold text-gray-900 mb-2">{property.title}</h4>
                          <p className="text-gray-600 text-sm mb-4 line-clamp-2">{property.description}</p>
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-2xl font-bold text-gray-900">${property.price}</span>
                              {property.originalPrice && (
                                <span className="text-gray-500 line-through ml-2">${property.originalPrice}</span>
                              )}
                              <span className="text-gray-500 text-sm">/night</span>
                            </div>
                            <span className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                              View Details
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </Reveal>
                ))
              )}
            </div>
          </div>

          {/* Featured Properties */}
          <div>
            <Reveal>
              <h3 className="text-2xl font-bold text-gray-900 mb-8">Featured Properties</h3>
            </Reveal>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {loading ? (
                // Loading skeleton
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 animate-pulse">
                    <div className="h-40 bg-gray-200"></div>
                    <div className="p-4">
                      <div className="h-5 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded mb-3 w-4/5"></div>
                      <div className="flex items-center justify-between">
                        <div className="h-6 bg-gray-200 rounded w-16"></div>
                        <div className="h-5 w-5 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : featuredProperties.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <p className="text-gray-500 text-lg">No featured properties available yet.</p>
                </div>
              ) : (
                featuredProperties.map((property, index) => (
                  <Reveal key={property.id} delay={0.1 * index}>
                    <Link href={`/hotel/${property.id}`} className="block">
                      <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 group cursor-pointer">
                        <div className="relative h-40 overflow-hidden">
                          <img
                            src={property.images?.[0]}
                            alt={property.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                          <div className="absolute bottom-3 left-3">
                            <div className="flex items-center bg-white/90 backdrop-blur-sm px-2 py-1 rounded">
                              <Star className="w-3 h-3 text-yellow-500 fill-current mr-1" />
                              <span className="text-sm font-semibold">{property.rating}</span>
                            </div>
                          </div>
                        </div>
                        <div className="p-4">
                          <h4 className="font-bold text-gray-900 mb-1">{property.title}</h4>
                          <p className="text-gray-600 text-xs mb-3 line-clamp-2">{property.description}</p>
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-lg font-bold text-gray-900">${property.price}</span>
                              {property.originalPrice && (
                                <span className="text-gray-500 line-through ml-2 text-sm">${property.originalPrice}</span>
                              )}
                              <span className="text-gray-500 text-xs">/night</span>
                            </div>
                            <span className="text-orange-500 hover:text-orange-600 transition-colors">
                              <ChevronRight className="w-5 h-5" />
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </Reveal>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Community Features */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <Reveal>
            <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Community Features</h2>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Share A Stay */}
            <Reveal delay={0.1}>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100 hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center mb-6">
                  <div className="w-14 h-14 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Users className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 ml-6">Share A Stay</h3>
                </div>
                <p className="text-gray-600 mb-8 leading-relaxed">
                  Connect with compatible roommates and share accommodation costs. Our matching algorithm helps you find the perfect roommate based on lifestyle, preferences, and budget.
                </p>
                <a
                  href="/share-stay"
                  className="inline-flex items-center text-blue-600 hover:text-blue-700 font-semibold text-lg"
                >
                  Start Sharing <ArrowRight className="w-5 h-5 ml-2" />
                </a>
              </div>
            </Reveal>

            {/* Find A Roommate */}
            <Reveal delay={0.2}>
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-8 border border-emerald-100 hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center mb-6">
                  <div className="w-14 h-14 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Users className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 ml-6">Find A Roommate</h3>
                </div>
                <p className="text-gray-600 mb-8 leading-relaxed">
                  Browse through verified profiles and find your ideal roommate. Filter by location, budget, lifestyle preferences, and compatibility scores to make the perfect match.
                </p>
                <a
                  href="/find-roommate"
                  className="inline-flex items-center text-emerald-600 hover:text-emerald-700 font-semibold text-lg"
                >
                  Browse Roommates <ArrowRight className="w-5 h-5 ml-2" />
                </a>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Host CTA */}
      <section className="py-20 bg-gradient-to-r from-orange-50 to-amber-50">
        <div className="container mx-auto px-4">
          <Reveal>
            <div className="max-w-3xl mx-auto text-center">
              <h3 className="text-4xl font-bold text-gray-900 mb-6">Ready to Host?</h3>
              <p className="text-gray-600 text-lg mb-10 max-w-2xl mx-auto">
                Join thousands of hosts who are earning passive income by sharing their space. List your property today and start welcoming guests from around the world.
              </p>
              <a
                href="/auth/signup?role=host"
                className="inline-block bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-lg px-12 py-4 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                List Your Property Today
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-8 md:mb-0">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-xl">S</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold">STAYNESTLY</h2>
                  <p className="text-gray-400 text-sm">Discover Your Sanctuary</p>
                </div>
              </div>
            </div>

            <div className="flex space-x-8">
              <a href="/privacy" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a>
              <a href="/terms" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a>
              <a href="/contact" className="text-gray-400 hover:text-white transition-colors">Contact Us</a>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} STAYNESTLY. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Chatbot Widget */}
      <div className="fixed bottom-6 right-6 z-50">
        <ChatbotWidget isFloating={true} />
      </div>

      {/* Close dropdowns when clicking outside */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
      {isProfileMenuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsProfileMenuOpen(false)}
        />
      )}
    </main>
  );
}
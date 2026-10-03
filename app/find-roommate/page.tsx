"use client";
import { useState, useEffect } from 'react';
import { MapPin, MessageCircle, Filter, X, User, Map, Users, MessageSquare, Navigation, Calendar, DollarSign, Globe, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Reveal from '@/components/Reveal';
import dynamic from 'next/dynamic';
import { useAuth } from '@/context/AuthContext';

// Dynamically import RoommateMap to prevent SSR hydration issues
const RoommateMap = dynamic(() => import('@/components/RoommateMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] bg-gray-100 rounded-xl flex items-center justify-center">
      <div className="text-center">
        <Globe className="w-10 h-10 text-gray-400 mx-auto mb-2 animate-pulse" />
        <p className="text-gray-500">Loading map...</p>
      </div>
    </div>
  )
});

import { fetchRoommates, Roommate } from '@/lib/data';

interface FilterOptions {
  ageRange: [number, number];
  gender: string[];
  budgetRange: [number, number];
  moveInDate: string;
  distance: number;
}

export default function FindRoommatePage() {
  const { user } = useAuth();
  const [roommates, setRoommates] = useState<Roommate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterOptions>({
    ageRange: [18, 50],
    gender: ['Male', 'Female', 'Other', 'Prefer not to say'],
    budgetRange: [0, 5000],
    moveInDate: '',
    distance: 50
  });
  const [showFilters, setShowFilters] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [usingDefaultLocation, setUsingDefaultLocation] = useState(false);
  const [mapView, setMapView] = useState(false);

  // Initialize and load
  useEffect(() => {
    initLocation();
  }, [user]);

  const initLocation = async () => {
    setLoading(true);

    // Check for Secure Context (HTTPS) - critical for mobile testing via IP
    const isSecure = typeof window !== 'undefined' ? window.isSecureContext : true;
    if (!isSecure && typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
      alert("⚠️ Location services require HTTPS. If you are testing on mobile via IP address, the browser will likely block location access. Please use localhost or a secure tunnel (like ngrok).");
    }

    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);
          setUsingDefaultLocation(false);
          await loadRoommates(location);
        },
        async (error) => {
          console.warn('Geolocation error:', error);

          let msg = "Could not get your location.";
          if (error.code === error.PERMISSION_DENIED) {
            msg = "Location permission denied. Please enable it in your browser settings.";
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            msg = "Location information is unavailable.";
          } else if (error.code === error.TIMEOUT) {
            msg = "Location request timed out.";
          }

          if (!isSecure) {
            msg += " (Likely due to non-HTTPS connection)";
          }

          alert(msg); // Using alert for immediate feedback on mobile
          useDefaultLocation();
        },
        { timeout: 15000, enableHighAccuracy: true }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
      useDefaultLocation();
    }
  };

  const useDefaultLocation = async () => {
    const defaultLocation = { lat: 40.7128, lng: -74.0060 };
    setUserLocation(defaultLocation);
    setUsingDefaultLocation(true);
    await loadRoommates(defaultLocation);
  };

  const handleManualLocation = () => {
    initLocation();
  };

  // Load roommates from Firestore
  const loadRoommates = async (centerLocation: { lat: number, lng: number }) => {
    try {
      const fetchedRoommates = await fetchRoommates(user?.uid);

      const roommatesWithDistance = fetchedRoommates.map(roommate => ({
        ...roommate,
        distance: calculateDistance(
          centerLocation.lat,
          centerLocation.lng,
          roommate.location.lat,
          roommate.location.lng
        )
      })).sort((a, b) => (a.distance || 0) - (b.distance || 0));

      setRoommates(roommatesWithDistance);
    } catch (error) {
      console.error("Error loading roommates:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate distance using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return Math.round(distance * 10) / 10; // Round to 1 decimal place
  };

  // Filter roommates
  const filteredRoommates = roommates.filter(roommate => {
    const age = Number(roommate.age) || 25; // Handle if age is string or missing
    const ageInRange = age >= filters.ageRange[0] && age <= filters.ageRange[1];
    const genderMatch = filters.gender.includes(roommate.gender || 'Other');

    // Budget can be null/undefined in some data, handle gracefully
    const rMin = roommate.budget?.min || 0;
    const rMax = roommate.budget?.max || 99999;

    // Check overlap: Roommate range overlaps with Filter range
    const budgetOverlap = rMin <= filters.budgetRange[1] && rMax >= filters.budgetRange[0];

    // Distance check
    const distanceInRange = (roommate.distance || 0) <= filters.distance;

    return ageInRange && genderMatch && budgetOverlap && distanceInRange;
  });

  // WhatsApp redirect
  const handleWhatsAppRedirect = (roommate: Roommate) => {
    const phone = roommate.whatsappNumber || (roommate as any).phone;

    if (phone) {
      const message = `Hi ${roommate.name}! I saw your profile on STAYNESTLY and I'm interested in connecting about potential roommate opportunities.`;
      const url = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
    } else {
      alert("This user hasn't provided a contact number.");
    }
  };

  // Apply filters
  const applyFilters = () => {
    setShowFilters(false);
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      ageRange: [18, 60],
      gender: ['Male', 'Female', 'Other', 'Prefer not to say'],
      budgetRange: [0, 5000],
      moveInDate: '',
      distance: 50
    });
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Find A Roommate</h1>
            </div>

            <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto">
              <button
                onClick={handleManualLocation}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors whitespace-nowrap"
                disabled={loading}
              >
                <MapPin className="w-4 h-4" />
                <span>Use My Location</span>
              </button>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
                disabled={loading}
              >
                <Filter className="w-5 h-5" />
                <span className="hidden md:inline">Filters</span>
              </button>

              <button
                onClick={() => setMapView(!mapView)}
                className="flex items-center space-x-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
                disabled={loading}
              >
                {mapView ? <Users className="w-5 h-5" /> : <Map className="w-5 h-5" />}
                <span className="hidden md:inline">{mapView ? 'List View' : 'Map View'}</span>
              </button>
            </div>
          </div>

          {usingDefaultLocation && (
            <div className="mt-2 text-xs text-amber-600 bg-amber-50 p-2 rounded flex items-center justify-center animate-in fade-in text-center">
              <span>📍 Showing default location (NYC). <br />Location failed. Tap "Use My Location" to try again.</span>
            </div>
          )}
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar */}
          <div className={`lg:w-1/4 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <Reveal>
              <div className="bg-white rounded-xl shadow-lg p-6 sticky top-24">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Filters</h2>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Age Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Age Range: {filters.ageRange[0]} - {filters.ageRange[1]}
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="range"
                        min="18"
                        max="60"
                        value={filters.ageRange[0]}
                        onChange={(e) => setFilters({ ...filters, ageRange: [parseInt(e.target.value), filters.ageRange[1]] })}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <input
                        type="range"
                        min="18"
                        max="60"
                        value={filters.ageRange[1]}
                        onChange={(e) => setFilters({ ...filters, ageRange: [filters.ageRange[0], parseInt(e.target.value)] })}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Gender</label>
                    <div className="flex flex-wrap gap-2">
                      {(['Male', 'Female', 'Other', 'Prefer not to say']).map(gender => (
                        <button
                          key={gender}
                          onClick={() => {
                            if (filters.gender.includes(gender)) {
                              if (filters.gender.length > 1) {
                                setFilters({ ...filters, gender: filters.gender.filter(g => g !== gender) });
                              }
                            } else {
                              setFilters({ ...filters, gender: [...filters.gender, gender] });
                            }
                          }}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filters.gender.includes(gender)
                            ? 'bg-blue-100 text-blue-700 border border-blue-300'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                          {gender}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Budget */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Budget: ${filters.budgetRange[0]} - ${filters.budgetRange[1]}
                    </label>
                    <div className="flex space-x-2">
                      <div className="w-1/2">
                        <input
                          type="number"
                          min="0"
                          value={filters.budgetRange[0]}
                          onChange={(e) => setFilters({ ...filters, budgetRange: [parseInt(e.target.value) || 0, filters.budgetRange[1]] })}
                          className="w-full px-2 py-1 border rounded"
                          placeholder="Min"
                        />
                      </div>
                      <div className="w-1/2">
                        <input
                          type="number"
                          min="0"
                          value={filters.budgetRange[1]}
                          onChange={(e) => setFilters({ ...filters, budgetRange: [filters.budgetRange[0], parseInt(e.target.value) || 0] })}
                          className="w-full px-2 py-1 border rounded"
                          placeholder="Max"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Distance */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Distance: Within {filters.distance}km
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="1000"
                      value={filters.distance}
                      onChange={(e) => setFilters({ ...filters, distance: parseInt(e.target.value) })}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={applyFilters}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors"
                    >
                      Apply Filters
                    </button>
                    <button
                      onClick={resetFilters}
                      className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2.5 rounded-lg transition-colors"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>

          {/* Main Content */}
          <div className={`${showFilters ? 'hidden lg:block' : 'block'} flex-1`}>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                <p className="text-gray-500">Finding potential roommates near you...</p>
              </div>
            ) : mapView ? (
              // Map View
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900">Nearby Roommates Map</h3>
                  <span className="text-gray-600">{filteredRoommates.length} results</span>
                </div>
                <RoommateMap
                  roommates={filteredRoommates}
                  userLocation={userLocation}
                  onRoommateClick={(id) => {
                    const roommate = filteredRoommates.find(r => r.id === id);
                    if (roommate) {
                      setMapView(false);
                      console.log("Selected:", roommate.name);
                    }
                  }}
                  maxDistance={filters.distance}
                />
              </div>
            ) : (
              // List View
              <div className="space-y-4">
                {filteredRoommates.length === 0 ? (
                  <Reveal>
                    <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                      <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-gray-900 mb-2">No Roommates Found</h3>
                      <p className="text-gray-600 mb-6">Try adjusting your filters or expanding the distance search.</p>
                      <button
                        onClick={resetFilters}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
                      >
                        Reset Filters
                      </button>
                    </div>
                  </Reveal>
                ) : (
                  filteredRoommates.map((roommate, index) => (
                    <Reveal key={roommate.id} delay={0.1 * index}>
                      <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border border-gray-100">
                        <div className="flex items-start space-x-4">
                          <div className="relative">
                            <img
                              src={roommate.image || 'https://via.placeholder.com/150'}
                              alt={roommate.name}
                              className="w-20 h-20 rounded-full object-cover"
                            />
                          </div>

                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-bold text-xl text-gray-900">{roommate.name}, {roommate.age}</h3>
                                <div className="flex items-center space-x-4 mt-1">
                                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full font-medium">
                                    {roommate.gender}
                                  </span>
                                  <span className="flex items-center text-gray-600 text-sm">
                                    <MapPin className="w-4 h-4 mr-1" />
                                    {roommate.distance}km away
                                  </span>
                                  {roommate.moveInDate && (
                                    <span className="flex items-center text-gray-600 text-sm">
                                      <Calendar className="w-4 h-4 mr-1" />
                                      move-in: {new Date(roommate.moveInDate).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="text-right">
                                <div className="font-bold text-lg text-gray-900">
                                  ${roommate.budget?.min} - ${roommate.budget?.max}
                                </div>
                                <div className="text-sm text-gray-500">per month</div>
                              </div>
                            </div>

                            <p className="text-gray-600 mt-3">{roommate.bio}</p>

                            <div className="flex flex-wrap gap-2 mt-3">
                              {roommate.interests.map((interest, idx) => (
                                <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                                  {interest}
                                </span>
                              ))}
                            </div>

                            <div className="flex items-center justify-between mt-6">
                              <div className="flex items-center text-sm text-gray-500">
                                {/* Last seen is optional in real data */}
                              </div>

                              <div className="flex space-x-3">
                                <Link
                                  href={`/profile?userId=${roommate.id}`}
                                  className="flex items-center space-x-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-5 py-2.5 rounded-lg font-medium transition-colors"
                                >
                                  <User className="w-5 h-5" />
                                  <span>View Profile</span>
                                </Link>
                                <button
                                  onClick={() => handleWhatsAppRedirect(roommate)}
                                  className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
                                >
                                  <MessageSquare className="w-5 h-5" />
                                  <span>Message</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Reveal>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
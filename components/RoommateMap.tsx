"use client";
import { useEffect, useState, useRef } from 'react';
import { MapPin } from 'lucide-react';

import { Roommate } from '@/lib/data';

interface RoommateMapProps {
  roommates: Roommate[];
  userLocation: { lat: number; lng: number } | null;
  onRoommateClick?: (id: string) => void;
  maxDistance?: number;
}

export default function RoommateMap({
  roommates,
  userLocation,
  onRoommateClick,
  maxDistance = 10
}: RoommateMapProps) {
  const [isClient, setIsClient] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  // Ensure we only run on client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load and initialize map only on client side
  useEffect(() => {
    if (!isClient || !mapContainerRef.current || mapInstanceRef.current) return;

    const initMap = async () => {
      try {
        // Dynamically import Leaflet only on client
        const L = await import('leaflet');

        // Import CSS
        await import('leaflet/dist/leaflet.css');

        // Fix default marker icons
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });

        // Default center (NYC) or user location
        const center: [number, number] = userLocation
          ? [userLocation.lat, userLocation.lng]
          : [40.7128, -74.0060];

        // Create map instance
        const map = L.default.map(mapContainerRef.current!, {
          center,
          zoom: 13,
          scrollWheelZoom: true,
        });

        // Add tile layer
        L.default.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        // Add user location marker
        if (userLocation) {
          const userMarker = L.default.marker([userLocation.lat, userLocation.lng])
            .addTo(map)
            .bindPopup('<strong class="text-blue-600">Your Location</strong>');

          // Add distance circle
          L.default.circle([userLocation.lat, userLocation.lng], {
            radius: maxDistance * 1000,
            color: 'blue',
            fillColor: 'blue',
            fillOpacity: 0.1,
            weight: 2,
            dashArray: '10, 10'
          }).addTo(map);
        }

        // Add roommate markers
        roommates.forEach((roommate) => {
          const popupContent = `
            <div class="p-2 min-w-[200px]">
              <div class="flex items-center gap-3 mb-2">
                <div class="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                  <img src="${roommate.image}" alt="${roommate.name}" class="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 class="font-bold text-gray-900">${roommate.name}</h3>
                  <p class="text-sm text-gray-600">${roommate.age} • ${roommate.gender}</p>
                </div>
              </div>
              <p class="text-sm text-gray-700 mb-2">${roommate.bio.substring(0, 80)}...</p>
              <div class="flex items-center justify-between text-xs text-gray-600">
                <span>$${roommate.budget.min}-$${roommate.budget.max}/mo</span>
                <span class="text-blue-600 font-medium">${roommate.distance} km away</span>
              </div>
            </div>
          `;

          const marker = L.default.marker([roommate.location.lat, roommate.location.lng])
            .addTo(map)
            .bindPopup(popupContent);

          marker.on('click', () => {
            if (onRoommateClick) {
              onRoommateClick(roommate.id);
            }
          });
        });

        mapInstanceRef.current = map;
        setMapLoaded(true);
      } catch (error) {
        console.error('Failed to load map:', error);
      }
    };

    initMap();

    // Cleanup on unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isClient, userLocation, roommates, maxDistance, onRoommateClick]);

  // Show loading state
  if (!isClient) {
    return (
      <div className="w-full h-[400px] bg-gray-200 rounded-lg flex items-center justify-center">
        <div className="text-gray-500 flex items-center gap-2">
          <MapPin className="w-5 h-5 animate-pulse" />
          Loading map...
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[400px] rounded-lg overflow-hidden shadow-lg">
      <div
        ref={mapContainerRef}
        className="w-full h-full"
        style={{ minHeight: '400px' }}
      />

      {/* Map Legend */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 text-sm z-[1000]">
        <div className="font-bold mb-2 text-gray-900">Legend</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
            <span className="text-gray-700">You</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-600 rounded-full"></div>
            <span className="text-gray-700">Roommates</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-blue-600 border-dashed rounded-full"></div>
            <span className="text-gray-700">{maxDistance}km radius</span>
          </div>
        </div>
      </div>
    </div>
  );
}

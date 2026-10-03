"use client";
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { CreditCard, Calendar, User, CheckCircle, Lock, ArrowRight, MapPin, Star, X, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';

// Mock property data (will be replaced with Firestore later)
const MOCK_PROPERTIES = [
  {
    id: '1',
    title: 'Luxury Ocean Villa',
    city: 'Malibu, CA',
    price: 350,
    rating: 4.9,
    images: ['https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&q=80&w=1200'],
  },
  {
    id: '2',
    title: 'Cozy Mountain Cabin',
    city: 'Aspen, CO',
    price: 180,
    rating: 4.7,
    images: ['https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=1200'],
  },
  {
    id: '3',
    title: 'Modern City Apartment',
    city: 'New York, NY',
    price: 220,
    rating: 4.5,
    images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=1200'],
  }
];

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const propertyId = params.id as string;

  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    checkIn: new Date().toISOString().split('T')[0],
    checkOut: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    guests: 1
  });

  useEffect(() => {
    const fetchProperty = async () => {
      setLoading(true);

      try {
        // First try to fetch from Firestore
        const { doc, getDoc } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase');

        const docRef = doc(db, 'properties', propertyId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setProperty({
            id: docSnap.id,
            title: data.title || 'Untitled Property',
            city: data.city || data.location || 'Unknown Location',
            price: data.price || data.pricePerNight || 0,
            rating: data.rating || 4.5,
            images: data.images || [data.imageUrl] || [],
            ownerId: data.ownerId || null,
          });
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error('Error fetching from Firestore:', error);
      }

      // Fallback: Try to find property in mock data
      let found = MOCK_PROPERTIES.find(p => p.id === propertyId);

      // Fallback to localStorage
      if (!found && typeof window !== 'undefined') {
        const savedProperties = localStorage.getItem('staynestly_listings');
        if (savedProperties) {
          try {
            const parsed = JSON.parse(savedProperties);
            found = parsed.find((p: any) => p.id === propertyId);
          } catch (err) {
            console.error("Error parsing localStorage:", err);
          }
        }
      }

      setProperty(found || null);
      setLoading(false);
    };

    fetchProperty();
  }, [propertyId]);


  const calculateNights = () => {
    const start = new Date(formData.checkIn);
    const end = new Date(formData.checkOut);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
  };

  const calculateTotal = () => {
    if (!property) return 0;
    const nights = calculateNights();
    const subtotal = nights * property.price;
    const serviceFee = subtotal * 0.1;
    const tax = subtotal * 0.05;
    return subtotal + serviceFee + tax;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleBooking = async () => {
    if (!formData.fullName || !formData.email || !formData.cardNumber) {
      setNotification({ type: 'warning', message: 'Please fill in all required fields' });
      return;
    }

    if (!user) {
      setNotification({ type: 'error', message: 'Please log in to complete your booking' });
      return;
    }

    setIsProcessing(true);
    setNotification(null);

    try {
      // Save booking to Firestore
      const { addDoc, collection, serverTimestamp, doc, updateDoc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');

      const bookingData = {
        propertyId: propertyId,
        propertyTitle: property.title,
        userId: user.uid, // Required by Firestore rules
        ownerId: property.ownerId || null, // Property owner for host access
        guestName: formData.fullName,
        guestEmail: formData.email,
        guestPhone: formData.phone,
        checkInDate: formData.checkIn,
        checkOutDate: formData.checkOut,
        totalGuests: formData.guests,
        totalCost: total,
        status: 'confirmed',
        paymentStatus: 'paid',
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'bookings'), bookingData);

      // Update user availability
      try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          busyUntil: new Date(formData.checkOut)
        });
      } catch (err) {
        console.error("Error updating user busy status", err);
      }

      setNotification({ type: 'success', message: 'Booking Confirmed! 🎉 Redirecting...' });
      setTimeout(() => {
        router.push(`/booking/confirmation/${docRef.id}`);
      }, 1500);
    } catch (error: any) {
      console.error('Booking error:', error);
      if (error?.code === 'permission-denied') {
        setNotification({ type: 'error', message: 'Permission denied. Please ensure you are logged in.' });
      } else {
        setNotification({ type: 'error', message: 'Failed to complete booking. Please try again.' });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800 mb-4">Property Not Found</h1>
          <button
            onClick={() => router.push('/')}
            className="text-orange-600 hover:text-orange-700 font-medium"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  const nights = calculateNights();
  const subtotal = nights * property.price;
  const serviceFee = subtotal * 0.1;
  const tax = subtotal * 0.05;
  const total = calculateTotal();

  return (
    <main className="bg-gray-50 py-16 min-h-screen relative">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 max-w-sm w-full animate-in slide-in-from-top-2 fade-in duration-300 ${notification.type === 'success' ? 'bg-green-50 border-green-200' :
          notification.type === 'error' ? 'bg-red-50 border-red-200' :
            'bg-amber-50 border-amber-200'
          } border rounded-xl shadow-lg p-4`}>
          <div className="flex items-start gap-3">
            <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${notification.type === 'success' ? 'bg-green-500' :
              notification.type === 'error' ? 'bg-red-500' :
                'bg-amber-500'
              }`}>
              {notification.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-white" />
              ) : (
                <AlertCircle className="w-4 h-4 text-white" />
              )}
            </div>
            <p className={`flex-1 text-sm font-medium ${notification.type === 'success' ? 'text-green-800' :
              notification.type === 'error' ? 'text-red-800' :
                'text-amber-800'
              }`}>
              {notification.message}
            </p>
            <button
              onClick={() => setNotification(null)}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      <div className="max-w-7xl mx-auto px-6">

        {/* Header */}
        <h1 className="text-5xl font-extrabold text-slate-800 tracking-tight mb-4">
          Complete Your Stay
        </h1>
        <p className="text-xl text-slate-500 mb-12">
          You're one step away from confirming your reservation.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* Left Column: Forms */}
          <div className="lg:col-span-2 space-y-10">

            {/* Guest Information */}
            <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
              <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                <User className="w-6 h-6 text-orange-600" /> Guest Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Full Name *"
                  className="p-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                  required
                />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Email Address *"
                  className="p-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                  required
                />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Phone Number"
                  className="p-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 md:col-span-2"
                />
              </div>
            </div>

            {/* Booking Dates */}
            <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
              <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                <Calendar className="w-6 h-6 text-orange-600" /> Booking Dates
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Check-in</label>
                  <input
                    type="date"
                    name="checkIn"
                    value={formData.checkIn}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Check-out</label>
                  <input
                    type="date"
                    name="checkOut"
                    value={formData.checkOut}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Guests</label>
                  <input
                    type="number"
                    name="guests"
                    min="1"
                    max="10"
                    value={formData.guests}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
              <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                <CreditCard className="w-6 h-6 text-orange-600" /> Payment Method
              </h2>
              <div className="flex items-center text-green-600 mb-4">
                <Lock className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">100% Secure Transaction</span>
              </div>
              <div className="space-y-4">
                <input
                  type="text"
                  name="cardNumber"
                  value={formData.cardNumber}
                  onChange={handleInputChange}
                  placeholder="Card Number *"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                  maxLength={16}
                  required
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleInputChange}
                    placeholder="MM/YY *"
                    className="p-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                    maxLength={5}
                    required
                  />
                  <input
                    type="text"
                    name="cvv"
                    value={formData.cvv}
                    onChange={handleInputChange}
                    placeholder="CVV *"
                    className="p-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                    maxLength={3}
                    required
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Booking Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 bg-white p-6 rounded-2xl shadow-2xl border-2 border-orange-100">

              <h3 className="text-xl font-bold text-slate-800 mb-4 border-b pb-2">
                Booking Summary
              </h3>

              {/* Property Info */}
              <div className="mb-6">
                <div className="relative w-full h-40 rounded-lg overflow-hidden mb-4">
                  <Image
                    src={property.images?.[0] || '/placeholder.jpg'}
                    alt={property.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <h4 className="font-bold text-lg text-slate-800 mb-1">{property.title}</h4>
                <p className="text-sm text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {property.city}
                </p>
                <p className="text-sm text-amber-600 flex items-center gap-1 mt-1">
                  <Star className="w-3 h-3 fill-current" /> {property.rating} Rating
                </p>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">${property.price} × {nights} {nights === 1 ? 'night' : 'nights'}</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Service Fee</span>
                  <span className="font-medium">${serviceFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Taxes</span>
                  <span className="font-medium">${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-3 border-t-2 border-orange-100">
                  <span className="font-bold text-lg text-slate-800">Total</span>
                  <span className="font-bold text-2xl text-orange-600">${total.toFixed(2)}</span>
                </div>
              </div>

              {/* Confirm Button */}
              <button
                onClick={handleBooking}
                disabled={isProcessing}
                className="w-full mt-6 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:from-gray-400 disabled:to-gray-400 text-white font-bold py-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Confirm & Pay ${total.toFixed(2)}
                  </>
                )}
              </button>

              <p className="text-xs text-center text-slate-500 mt-4">
                By confirming, you agree to our Terms of Service
              </p>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}

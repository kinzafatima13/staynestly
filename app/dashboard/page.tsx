"use client";
import React, { useEffect, useState } from 'react';
import {
  Bell, Home, DollarSign, Calendar, User, LogOut,
  Plus, Eye, Edit, Trash2, TrendingUp, Users,
  Star, CheckCircle, Clock, MessageSquare, Settings
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';

interface Listing {
  id: string;
  title: string;
  price: number;
  location: string;
  status: 'active' | 'pending' | 'inactive';
  bookings: number;
  rating: number;
  image: string;
  createdAt?: any;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  amount?: number;
  type: 'booking' | 'message' | 'review' | 'payment';
  read: boolean;
}

export default function HostDashboard() {
  const router = useRouter();
  const { user, role, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const [listings, setListings] = useState<Listing[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState({
    totalEarnings: 0,
    activeBookings: 0,
    occupancyRate: 0,
    averageRating: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Redirect if not authenticated or not a host
    if (!authLoading && (!user || role !== 'host')) {
      // Show toast to guest users instead of alert
      if (user && role === 'guest') {
        showToast('Dashboard is only accessible to hosts. Please sign up as a host to access this feature.', 'error');
      }
      router.push(user && role === 'guest' ? '/' : '/auth/login');
      return;
    }

    if (!user) return;

    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch host's properties (without orderBy to avoid requiring index)
        const propertiesQuery = query(
          collection(db, 'properties'),
          where('ownerId', '==', user.uid)
        );
        const propertiesSnapshot = await getDocs(propertiesQuery);

        const propertiesList: Listing[] = [];
        propertiesSnapshot.forEach((doc) => {
          const data = doc.data();
          propertiesList.push({
            id: doc.id,
            title: data.title || '',
            price: data.price || data.pricePerNight || 0,
            location: data.city || data.location || '',
            status: data.status || 'active',
            bookings: data.bookings || 0,
            rating: data.rating || 0,
            image: data.images?.[0] || data.imageUrl || '',
            createdAt: data.createdAt
          });
        });

        // Sort by createdAt in memory (newest first)
        propertiesList.sort((a, b) => {
          const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return bTime - aTime;
        });

        // Limit to 10 properties
        setListings(propertiesList.slice(0, 10));

        // Fetch all bookings where this host is the owner
        let allBookings: any[] = [];

        try {
          const bookingsQuery = query(
            collection(db, 'bookings'),
            where('ownerId', '==', user.uid)
          );
          const bookingsSnapshot = await getDocs(bookingsQuery);
          bookingsSnapshot.forEach((doc) => {
            allBookings.push({ id: doc.id, ...doc.data() });
          });

          // Sort bookings by createdAt in memory (newest first)
          allBookings.sort((a, b) => {
            const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
            const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
            return bTime - aTime;
          });
        } catch (bookingError) {
          console.warn('Could not fetch bookings:', bookingError);
          // Continue with empty bookings - don't fail the whole dashboard
        }

        // Calculate stats from real data
        const totalEarnings = allBookings.reduce((sum, booking) => {
          return sum + (booking.totalPrice || 0);
        }, 0);

        const now = new Date();
        const activeBookings = allBookings.filter(booking => {
          const checkOut = booking.checkOut?.toDate ? booking.checkOut.toDate() : new Date(booking.checkOut);
          return checkOut > now;
        }).length;

        const totalRatings = propertiesList.reduce((sum, prop) => sum + (prop.rating || 0), 0);
        const averageRating = propertiesList.length > 0 ? totalRatings / propertiesList.length : 0;

        const occupancyRate = propertiesList.length > 0
          ? Math.round((allBookings.length / (propertiesList.length * 30)) * 100)
          : 0;

        setStats({
          totalEarnings: Math.round(totalEarnings),
          activeBookings,
          occupancyRate: Math.min(occupancyRate, 100),
          averageRating: Math.round(averageRating * 10) / 10
        });

        // Create notifications from recent bookings
        const recentBookings = allBookings
          .sort((a, b) => {
            const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
            const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
            return bDate.getTime() - aDate.getTime();
          })
          .slice(0, 5);

        const notificationsList: Notification[] = recentBookings.map((booking, index) => {
          const property = propertiesList.find(p => p.id === booking.propertyId || p.id === booking.hotelId);
          const bookingDate = booking.createdAt?.toDate ? booking.createdAt.toDate() : new Date(booking.createdAt);
          const now = new Date();
          const hoursDiff = Math.floor((now.getTime() - bookingDate.getTime()) / (1000 * 60 * 60));

          let timeAgo = '';
          if (hoursDiff < 1) timeAgo = 'Just now';
          else if (hoursDiff < 24) timeAgo = `${hoursDiff} hours ago`;
          else timeAgo = `${Math.floor(hoursDiff / 24)} days ago`;

          return {
            id: booking.id,
            title: 'New Booking!',
            message: `${booking.guestName || 'A guest'} booked ${property?.title || 'your property'} for ${booking.nights || 1} nights`,
            date: timeAgo,
            amount: booking.totalPrice || 0,
            type: 'booking',
            read: index > 2
          };
        });

        setNotifications(notificationsList);

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Keep default empty states on error
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, role, authLoading, router]);

  const handleLogout = async () => {
    const { logout } = await import('@/lib/auth');
    await logout();
    router.push('/');
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const handleDeleteListing = async (id: string) => {
    if (!confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
      return;
    }

    try {
      const { doc, deleteDoc } = await import('firebase/firestore');
      const propertyRef = doc(db, 'properties', id);
      await deleteDoc(propertyRef);

      // Remove from local state after successful delete
      setListings(prev => prev.filter(listing => listing.id !== id));
    } catch (error) {
      console.error('Error deleting listing:', error);
      alert('Failed to delete listing. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'inactive': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // Show loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                <Home className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Host Dashboard</h1>
            </div>

            <div className="flex items-center gap-4">
              <Link
                href="my-listings"
                className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-5 py-2.5 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg"
              >
                <Plus className="w-5 h-5" />
                Create Listing
              </Link>

              <div className="relative">
                <Link
                  href="/dashboard/notifications"
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative"
                >
                  <Bell className="w-6 h-6 text-gray-700" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </Link>
              </div>

              <Link
                href="/profile"
                className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <User className="w-5 h-5 text-gray-700" />
                <span className="hidden md:inline">Profile</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {user?.displayName || user?.email?.split('@')[0] || 'Host'}! 👋
            </h2>
            <p className="text-gray-600">
              Here's what's happening with your properties today.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Earnings Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-green-100 to-green-50 rounded-xl">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">${stats.totalEarnings.toLocaleString()}</h3>
              <p className="text-gray-500 text-sm mt-1">Total Earnings</p>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <span className="text-green-600 text-sm font-medium">↑ 12.5% from last month</span>
              </div>
            </div>

            {/* Active Bookings */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <Users className="w-5 h-5 text-blue-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{stats.activeBookings}</h3>
              <p className="text-gray-500 text-sm mt-1">Active Bookings</p>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <span className="text-blue-600 text-sm font-medium">{listings.length} listings</span>
              </div>
            </div>

            {/* Occupancy Rate */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-purple-100 to-purple-50 rounded-xl">
                  <Home className="w-6 h-6 text-purple-600" />
                </div>
                <CheckCircle className="w-5 h-5 text-purple-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{stats.occupancyRate}%</h3>
              <p className="text-gray-500 text-sm mt-1">Occupancy Rate</p>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <span className="text-purple-600 text-sm font-medium">High demand</span>
              </div>
            </div>

            {/* Average Rating */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-yellow-100 to-yellow-50 rounded-xl">
                  <Star className="w-6 h-6 text-yellow-600" />
                </div>
                <Star className="w-5 h-5 text-yellow-500" fill="currentColor" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{stats.averageRating}</h3>
              <p className="text-gray-500 text-sm mt-1">Average Rating</p>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <span className="text-yellow-600 text-sm font-medium">Excellent reviews</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Your Listings */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Your Listings</h2>
                    <p className="text-gray-500 text-sm mt-1">Manage your properties</p>
                  </div>
                  <Link
                    href="my-listings"
                    className="flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Add New
                  </Link>
                </div>

                <div className="divide-y divide-gray-100">
                  {listings.length === 0 ? (
                    <div className="p-8 text-center">
                      <Home className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Listings Yet</h3>
                      <p className="text-gray-500 mb-4">Create your first listing to start earning</p>
                      <Link
                        href="my-listings"
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all"
                      >
                        <Plus className="w-5 h-5" />
                        Create Listing
                      </Link>
                    </div>
                  ) : (
                    listings.map((listing) => (
                      <div key={listing.id} className="p-6 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start gap-4">
                          <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0">
                            <img
                              src={listing.image}
                              alt={listing.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-bold text-gray-900">{listing.title}</h3>
                                <div className="flex items-center gap-3 mt-2">
                                  <span className="flex items-center gap-1 text-sm text-gray-600">
                                    <DollarSign className="w-4 h-4" />
                                    ${listing.price}/night
                                  </span>
                                  <span className="text-sm text-gray-600">•</span>
                                  <span className="text-sm text-gray-600">{listing.location}</span>
                                  <span className="text-sm text-gray-600">•</span>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(listing.status)}`}>
                                    {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Link
                                  href={`/hotel/${listing.id}`}
                                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                  title="View"
                                >
                                  <Eye className="w-4 h-4 text-gray-600" />
                                </Link>
                                <Link
                                  href={`/host/add-property/${listing.id}`}
                                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                  title="Edit"
                                >
                                  <Edit className="w-4 h-4 text-blue-600" />
                                </Link>
                                <button
                                  onClick={() => handleDeleteListing(listing.id)}
                                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </button>
                              </div>
                            </div>

                            <div className="flex items-center justify-between mt-4">
                              <div className="flex items-center gap-6">
                                <div className="flex items-center gap-1">
                                  <Star className="w-4 h-4 text-yellow-500" fill="currentColor" />
                                  <span className="text-sm font-medium">{listing.rating}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4 text-gray-500" />
                                  <span className="text-sm text-gray-600">{listing.bookings} bookings</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-gray-900">
                                  ${(listing.price * listing.bookings).toLocaleString()}
                                </div>
                                <div className="text-xs text-gray-500">Total revenue</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Notifications Sidebar */}
            <div className="space-y-6">
              {/* Notifications */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
                    <span className="text-sm text-gray-500">{unreadCount} unread</span>
                  </div>
                </div>

                <div className="max-h-[400px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center">
                      <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No notifications yet</p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${!notification.read ? 'bg-blue-50' : ''}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${notification.type === 'booking' ? 'bg-green-100 text-green-600' :
                            notification.type === 'review' ? 'bg-yellow-100 text-yellow-600' :
                              notification.type === 'payment' ? 'bg-blue-100 text-blue-600' :
                                'bg-purple-100 text-purple-600'
                            }`}>
                            {notification.type === 'booking' && <Calendar className="w-4 h-4" />}
                            {notification.type === 'review' && <Star className="w-4 h-4" />}
                            {notification.type === 'payment' && <DollarSign className="w-4 h-4" />}
                            {notification.type === 'message' && <MessageSquare className="w-4 h-4" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <h4 className="font-medium text-gray-900">{notification.title}</h4>
                              <span className="text-xs text-gray-500">{notification.date}</span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                            {notification.amount && (
                              <div className="mt-2">
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                                  <DollarSign className="w-3 h-3" />
                                  ${notification.amount}
                                </span>
                              </div>
                            )}
                            {!notification.read && (
                              <button
                                onClick={() => handleMarkAsRead(notification.id)}
                                className="mt-2 text-xs text-blue-600 hover:text-blue-700"
                              >
                                Mark as read
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-4 border-t border-gray-200">
                  <Link
                    href="/dashboard/notifications"
                    className="block text-center text-orange-600 hover:text-orange-700 font-medium text-sm"
                  >
                    View all notifications
                  </Link>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 text-white">
                <h3 className="font-bold text-lg mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Link
                    href="/my-listings"
                    className="flex items-center justify-between p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Plus className="w-5 h-5" />
                      <span>Create New Listing</span>
                    </div>
                    <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                      <Plus className="w-3 h-3" />
                    </div>
                  </Link>
                  <Link
                    href="/dashboard/calendar"
                    className="flex items-center justify-between p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5" />
                      <span>View Calendar</span>
                    </div>
                    <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                      <Calendar className="w-3 h-3" />
                    </div>
                  </Link>
                  <Link
                    href="/dashboard/earnings"
                    className="flex items-center justify-between p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-5 h-5" />
                      <span>Earnings Report</span>
                    </div>
                    <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-3 h-3" />
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
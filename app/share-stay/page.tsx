"use client";
import React, { useEffect, useState } from 'react';
import { Users, Search, Heart, MapPin, Calendar, User, MessageCircle, Filter, ChevronRight, MessageSquare, Phone, X, Image as ImageIcon, Star } from 'lucide-react';
import { collection, getDocs, query, orderBy, limit, addDoc, updateDoc, doc, arrayUnion, serverTimestamp, getDoc, arrayRemove, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { uploadMultipleImages, validateImageFile } from '@/lib/cloudinary';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Types
interface ShareStayPost {
  id: string;
  title: string;
  description: string;
  city: string;
  age: string;
  gender: string;
  preferredGender: string;
  preferredAge: string;
  price: number;
  date: string;
  userId?: string;
  userName?: string;
  whatsappNumber?: string;
  createdAt?: any;
  location?: string;
  images?: string[];
  likes: string[];
  userImage?: string;
  userRating?: number;
  userReviews?: number;
}

interface FilterState {
  ageRange: string;
  gender: string[];
  preferredGender: string[];
  maxPrice: number;
}

// Filter Component
const FilterSection = ({ filters, setFilters, applyFilters }: {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  applyFilters: () => void;
}) => {
  const handleGenderToggle = (gender: string) => {
    setFilters(prev => ({
      ...prev,
      gender: prev.gender.includes(gender)
        ? prev.gender.filter(g => g !== gender)
        : [...prev.gender, gender]
    }));
  };

  const handlePreferredGenderToggle = (gender: string) => {
    setFilters(prev => ({
      ...prev,
      preferredGender: prev.preferredGender.includes(gender)
        ? prev.preferredGender.filter(g => g !== gender)
        : [...prev.preferredGender, gender]
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      ageRange: '',
      gender: [],
      preferredGender: [],
      maxPrice: 2000
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">Filters</h3>
        <button
          onClick={handleClearFilters}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Clear all
        </button>
      </div>

      <div className="space-y-6">
        {/* Age Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Age Range</label>
          <select
            value={filters.ageRange}
            onChange={(e) => setFilters({ ...filters, ageRange: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Any Age</option>
            <option value="18-25">18-25</option>
            <option value="25-30">25-30</option>
            <option value="30-35">30-35</option>
            <option value="35+">35+</option>
          </select>
        </div>

        {/* Gender */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
          <div className="grid grid-cols-3 gap-2">
            {['Male', 'Female', 'Other'].map(gender => (
              <button
                key={gender}
                onClick={() => handleGenderToggle(gender)}
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

        {/* Preferred Gender */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Gender</label>
          <div className="grid grid-cols-3 gap-2">
            {['Male', 'Female', 'Any'].map(gender => (
              <button
                key={gender}
                onClick={() => handlePreferredGenderToggle(gender)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filters.preferredGender.includes(gender)
                  ? 'bg-green-100 text-green-700 border border-green-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                {gender}
              </button>
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Max Price: ${filters.maxPrice}
          </label>
          <input
            type="range"
            min="100"
            max="2000"
            step="50"
            value={filters.maxPrice}
            onChange={(e) => setFilters({ ...filters, maxPrice: parseInt(e.target.value) })}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>$100</span>
            <span>$2000</span>
          </div>
        </div>

        {/* Search Button */}
        <button
          onClick={applyFilters}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <Search className="w-5 h-5" />
          Apply Filters
        </button>
      </div>
    </div>
  );
};

// Post Form Component with Image Upload
const PostForm = ({ onPostPublished }: { onPostPublished?: () => void }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    city: '',
    age: '',
    gender: 'Female',
    preferredGender: 'Female',
    preferredAge: '20-30',
    price: '',
    date: '',
    location: '',
    whatsappNumber: ''
  });
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newImages = [...images, ...files].slice(0, 5); // Limit to 5 images
    setImages(newImages);

    // Create preview URLs
    const newPreviews = newImages.map(file => URL.createObjectURL(file));
    setImagePreviews(newPreviews);
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);

    const newPreviews = newImages.map(file => URL.createObjectURL(file));
    setImagePreviews(newPreviews);
  };

  const uploadImages = async () => {
    try {
      const imageUrls = await uploadMultipleImages(
        images,
        { folder: 'staynestly/share-stays', tags: ['share-stay'] },
        (progress) => setUploadProgress(progress)
      );
      return imageUrls;
    } catch (error) {
      console.error('Error uploading images:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!user) {
      alert("Please log in to publish a post.");
      return;
    }

    try {
      setIsSubmitting(true);
      setUploadProgress(0);

      // Upload images if any
      let imageUrls: string[] = [];
      if (images.length > 0) {
        imageUrls = await uploadImages();
      }

      // Create post document with authenticated user data
      const postData = {
        ...formData,
        images: imageUrls,
        price: parseInt(formData.price) || 0,
        likes: [],
        createdAt: serverTimestamp(),
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        userImage: user.photoURL || 'https://via.placeholder.com/150', // Better fallback
        userRating: 4.8, // Default rating for now
        userReviews: 0
      };

      await addDoc(collection(db, 'shareStays'), postData);

      // Trigger refresh of the feed
      if (onPostPublished) {
        onPostPublished();
      }

      // Reset form
      setFormData({
        title: '',
        description: '',
        city: '',
        age: '',
        gender: 'Female',
        preferredGender: 'Female',
        preferredAge: '20-30',
        price: '',
        date: '',
        location: '',
        whatsappNumber: ''
      });
      setImages([]);
      setImagePreviews([]);
      alert('Post published successfully!');

    } catch (error) {
      console.error('Error publishing post:', error);
      alert('Failed to publish post. Please try again.');
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., Cozy Flat Near Campus"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., Los Angeles"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          required
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Describe your accommodation and what you're looking for..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Your Age</label>
          <input
            type="number"
            name="age"
            value={formData.age}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., 24"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Your Gender</label>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="Female">Female</option>
            <option value="Male">Male</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Gender</label>
          <select
            name="preferredGender"
            value={formData.preferredGender}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="Female">Female</option>
            <option value="Male">Male</option>
            <option value="Any">Any</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Age Range</label>
          <select
            name="preferredAge"
            value={formData.preferredAge}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="18-25">18-25</option>
            <option value="20-30">20-30</option>
            <option value="25-35">25-35</option>
            <option value="30+">30+</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Price per Month ($)</label>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., 130"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Move-in Date</label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number</label>
        <input
          type="tel"
          name="whatsappNumber"
          value={formData.whatsappNumber}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="+1234567890"
        />
      </div>

      {/* Image Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Upload Photos (Max 5)</label>
        <div className="flex items-center gap-4">
          <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
            <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
            <span className="text-sm text-gray-600">Add Photos</span>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>

          <div className="flex-1 flex gap-2 overflow-x-auto py-2">
            {imagePreviews.map((preview, index) => (
              <div key={index} className="relative w-32 h-32">
                <Image
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  width={128}
                  height={128}
                  className="w-32 h-32 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {isSubmitting && uploadProgress > 0 && (
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${uploadProgress}%` }}
          ></div>
          <p className="text-sm text-gray-600 mt-1">Uploading images... {uploadProgress}%</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            Publishing...
          </>
        ) : (
          <>
            <MessageCircle className="w-5 h-5" />
            Publish Post
          </>
        )}
      </button>
    </form>
  );
};

// Community Stays Feed Component
const CommunityStaysFeed = ({ filters, refreshKey }: { filters: FilterState; refreshKey?: number }) => {
  const { user } = useAuth(); // Get authenticated user
  const router = useRouter(); // Use Next.js router
  const [posts, setPosts] = useState<ShareStayPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchPosts();
  }, [refreshKey]);

  useEffect(() => {
    // Sync initial active likes state
    const userBytes = new Set<string>();
    posts.forEach(post => {
      if (user && post.likes && post.likes.includes(user.uid)) {
        userBytes.add(post.id);
      }
    });
    setLikedPosts(userBytes);
  }, [posts, user]);


  const fetchPosts = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'shareStays'),
        orderBy('createdAt', 'desc'),
        limit(20)
      );

      const querySnapshot = await getDocs(q);
      const fetchedPosts: ShareStayPost[] = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          likes: data.likes || [],
          title: data.title || '',
          description: data.description || '',
          city: data.city || '',
          age: data.age || '',
          gender: data.gender || '',
          preferredGender: data.preferredGender || '',
          preferredAge: data.preferredAge || '',
          price: data.price || 0,
          date: data.date || '',
          userId: data.userId,
          userName: data.userName,
          whatsappNumber: data.whatsappNumber,
          createdAt: data.createdAt,
          location: data.location,
          images: data.images || [],
          userImage: data.userImage,
          userRating: data.userRating,
          userReviews: data.userReviews
        } as ShareStayPost;
      });

      setPosts(fetchedPosts);
    } catch (error) {
      console.error("Error fetching ShareStay posts:", error);
      // Fallback mock data if fetch fails
      setPosts(mockPosts);
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = posts.filter(post => {
    // Age filter
    if (filters.ageRange && post.preferredAge !== filters.ageRange) {
      return false;
    }

    // Gender filter
    if (filters.gender.length > 0 && !filters.gender.includes(post.gender)) {
      return false;
    }

    // Preferred gender filter
    if (filters.preferredGender.length > 0 && !filters.preferredGender.includes(post.preferredGender)) {
      return false;
    }

    // Price filter
    if (post.price > filters.maxPrice) {
      return false;
    }

    return true;
  });

  const handleLike = async (postId: string) => {
    if (!user) {
      alert("Please login to like posts");
      return;
    }

    try {
      const postRef = doc(db, 'shareStays', postId);

      if (likedPosts.has(postId)) {
        // Unlike
        setLikedPosts(prev => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });

        // Update local state
        setPosts(prev => prev.map(post =>
          post.id === postId
            ? { ...post, likes: post.likes.filter(id => id !== user.uid) }
            : post
        ));

        // Update Firestore
        await updateDoc(postRef, {
          likes: arrayRemove(user.uid)
        });
      } else {
        // Like
        setLikedPosts(prev => new Set(prev).add(postId));

        // Update local state
        setPosts(prev => prev.map(post =>
          post.id === postId
            ? { ...post, likes: [...post.likes, user.uid] }
            : post
        ));

        // Update Firestore
        await updateDoc(postRef, {
          likes: arrayUnion(user.uid)
        });
      }
    } catch (error) {
      console.error('Error updating like:', error);
    }
  };

  const handleViewProfile = (userId: string | undefined) => {
    if (userId) {
      router.push(`/profile?userId=${userId}`);
    } else {
      alert('User profile not available');
    }
  };

  const handleWhatsAppContact = (whatsappNumber?: string, title?: string) => {
    if (whatsappNumber) {
      const message = `Hi! I saw your "${title}" post on STAYNESTLY and I'm interested in connecting about potential roommate opportunities.`;
      const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
    } else {
      alert('WhatsApp number not available for this user');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-gray-900">Community Stays</h3>
        <span className="text-gray-600">{filteredPosts.length} posts found</span>
      </div>

      {filteredPosts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h4 className="text-xl font-bold text-gray-900 mb-2">No posts found</h4>
          <p className="text-gray-600">Try adjusting your filters or be the first to post!</p>
        </div>
      ) : (
        filteredPosts.map(post => (
          <div key={post.id} className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            {/* Post Header with Images */}
            <div className="flex flex-col md:flex-row gap-6">
              {/* Images Section */}
              {post.images && post.images.length > 0 && (
                <div className="md:w-1/3">
                  <div className="relative h-48 rounded-lg overflow-hidden">
                    <Image
                      src={post.images[0]}
                      alt={post.title}
                      fill
                      className="object-cover"
                    />
                    {post.images.length > 1 && (
                      <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        +{post.images.length - 1} more
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Content Section */}
              <div className={`${post.images && post.images.length > 0 ? 'md:w-2/3' : 'w-full'}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      {post.userImage ? (
                        <Image
                          src={post.userImage}
                          alt={post.userName || 'User'}
                          width={48}
                          height={48}
                          className="rounded-full"
                        />
                      ) : (
                        <User className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-gray-900">{post.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-gray-600">{post.userName || 'Anonymous'}, Age {post.age}</span>
                        {post.userRating && (
                          <div className="flex items-center text-sm text-yellow-600">
                            <Star className="w-3 h-3 fill-current" />
                            <span className="ml-1">{post.userRating}</span>
                            <span className="mx-1">•</span>
                            <span>{post.userReviews} reviews</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">${post.price}</div>
                    <div className="text-sm text-gray-500">per month</div>
                  </div>
                </div>

                <p className="text-gray-700 mb-4">{post.description}</p>

                {/* Location & Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <div className="flex items-center text-gray-600">
                      <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="truncate">Location: {post.location || `${post.city}, Country`}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span>Move-in: {post.date || 'Flexible'}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full font-medium">
                        Prefers: {post.preferredAge}
                      </span>
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full font-medium">
                        Gender: {post.preferredGender}
                      </span>
                      <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full font-medium">
                        Posted by: {post.gender}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleWhatsAppContact(post.whatsappNumber, post.title)}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium px-5 py-2.5 rounded-lg transition-colors flex-1 min-w-[150px] justify-center"
                  >
                    <MessageSquare className="w-5 h-5" />
                    Message on WhatsApp
                  </button>
                  <button
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center gap-2 border font-medium px-4 py-2.5 rounded-lg transition-colors ${likedPosts.has(post.id)
                      ? 'bg-red-50 border-red-300 text-red-600 hover:bg-red-100'
                      : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                      }`}
                  >
                    <Heart className={`w-5 h-5 ${likedPosts.has(post.id) ? 'fill-current' : ''}`} />
                    {likedPosts.has(post.id) ? 'Liked' : 'Like'} ({post.likes?.length || 0})
                  </button>
                  <button
                    onClick={() => handleViewProfile(post.userId)}
                    className="flex items-center gap-2 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium px-4 py-2.5 rounded-lg transition-colors"
                  >
                    <User className="w-5 h-5" />
                    View Profile
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

// Mock data for fallback
const mockPosts: ShareStayPost[] = [
  {
    id: '1',
    title: 'Cozy Flat Near Campus',
    description: 'Seeking for roommate for cozy flat near beach. Friendly, neat and clean! Looking for someone responsible and quiet.',
    city: 'Los Angeles',
    age: '24',
    gender: 'Female',
    preferredGender: 'Female',
    preferredAge: '20-30',
    price: 130,
    date: '2024-03-15',
    whatsappNumber: '+1234567890',
    location: '123 Beach St, LA',
    images: ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=800'],
    likes: [],
    userName: 'Sarah L.',
    userImage: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?auto=format&fit=crop&q=80&w=300',
    userRating: 4.8,
    userReviews: 24
  },
  {
    id: '2',
    title: 'Modern Apartment Downtown',
    description: 'Looking for female roommate, 20-30, for my 2BR apartment. Close to public transport and shopping centers.',
    city: 'New York',
    age: '28',
    gender: 'Female',
    preferredGender: 'Female',
    preferredAge: '20-30',
    price: 150,
    date: '2024-03-20',
    whatsappNumber: '+1234567891',
    location: '456 Downtown Ave, NY',
    images: ['https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&q=80&w=800'],
    likes: [],
    userName: 'Maria K.',
    userImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
    userRating: 4.6,
    userReviews: 18
  }
];

// Main Page Component
export default function ShareStayPage() {
  const [filters, setFilters] = useState<FilterState>({
    ageRange: '',
    gender: [],
    preferredGender: [],
    maxPrice: 2000
  });
  const [refreshKey, setRefreshKey] = useState(0);

  const handleApplyFilters = () => {
    // Filters are applied automatically via the filteredPosts function
    console.log('Filters applied:', filters);
  };

  const handlePublishNewPost = () => {
    // Scroll to form
    const formElement = document.getElementById('post-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleViewMyPosts = () => {
    // Future feature: Filter for my posts
    // For now, this is static
    alert('Coming soon! You can view your posts in your profile page.');
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl">
            <h1 className="text-5xl font-bold mb-4 tracking-tight">
              Share Your Sanctuary
            </h1>
            <p className="text-xl text-blue-100 mb-8">
              Discover Your Sanctuary. Connect with ideal roommates who match your vibe and lifestyle.
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={handlePublishNewPost}
                className="bg-white text-blue-600 hover:bg-blue-50 font-bold px-8 py-3 rounded-full transition-colors"
              >
                Publish a New Post
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column - Filters */}
          <div className="lg:w-1/4 space-y-8">
            <FilterSection
              filters={filters}
              setFilters={setFilters}
              applyFilters={handleApplyFilters}
            />

            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Active Posts</span>
                  <span className="font-bold text-blue-600">247</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Successful Matches</span>
                  <span className="font-bold text-green-600">189</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Response Rate</span>
                  <span className="font-bold text-purple-600">92%</span>
                </div>
              </div>
            </div>

            {/* Community Features */}
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl shadow-lg p-6 border border-indigo-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Community Features</h3>
              <div className="space-y-3">
                <Link href="/share-stay" className="flex items-center justify-between p-3 bg-white rounded-lg hover:shadow-md transition-shadow">
                  <span className="font-medium text-gray-800">Share A Stay</span>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </Link>
                <Link href="/find-roommate" className="flex items-center justify-between p-3 bg-white rounded-lg hover:shadow-md transition-shadow">
                  <span className="font-medium text-gray-800">Find A Roommate</span>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column - Main Content */}
          <div className="lg:w-3/4 space-y-8">
            {/* Publish New Post Card */}
            <div
              id="post-form"
              className="bg-white rounded-xl shadow-lg p-6 border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Publish Your Stay Request</h2>
                  <p className="text-gray-600 mt-1">Fill in details about your accommodation and preferences</p>
                </div>
                {/* Removed redundant button here */}
              </div>
              <PostForm onPostPublished={() => setRefreshKey(prev => prev + 1)} />
            </div>

            {/* Community Stays */}
            <CommunityStaysFeed filters={filters} refreshKey={refreshKey} />

            {/* Learn More Section */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white">
              <div className="max-w-3xl">
                <h3 className="text-3xl font-bold mb-4">Learn From Experience</h3>
                <p className="text-blue-100 mb-6">
                  Join thousands of successful roommate matches. Read stories, get tips, and learn how to find your perfect match.
                </p>
                <div className="flex flex-wrap gap-4">
                  <button className="bg-white text-blue-600 hover:bg-blue-50 font-bold px-6 py-3 rounded-lg transition-colors">
                    Read Success Stories
                  </button>
                  <button className="bg-transparent border-2 border-white hover:bg-white/10 text-white font-bold px-6 py-3 rounded-lg transition-colors">
                    Safety Guidelines
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
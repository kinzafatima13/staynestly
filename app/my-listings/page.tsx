"use client";
import React, { useState } from 'react';
import { 
  Upload, X, Home, MapPin, DollarSign, Calendar, 
  Wifi, Car, Utensils, Coffee, Wind, Tv, Shield, 
  Users, Check, Globe, Lock, Key, PawPrint
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { uploadMultipleImages, validateImageFile } from '@/lib/cloudinary';

// Define the ImageIcon component since it might be causing the issue
const ImageIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    className={className || "w-6 h-6"} 
    fill="none" 
    viewBox="0 0 24 24" 
    stroke="currentColor"
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={2} 
      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
    />
  </svg>
);

// Tag icon component
const TagIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    className={className || "w-5 h-5"} 
    fill="none" 
    viewBox="0 0 24 24" 
    stroke="currentColor"
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={2} 
      d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" 
    />
  </svg>
);

// Bed icon component
const BedIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    className={className || "w-5 h-5"} 
    fill="none" 
    viewBox="0 0 24 24" 
    stroke="currentColor"
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={2} 
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" 
    />
  </svg>
);

// Bath icon component
const BathIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    className={className || "w-5 h-5"} 
    fill="none" 
    viewBox="0 0 24 24" 
    stroke="currentColor"
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={2} 
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
    />
  </svg>
);

interface ListingFormData {
  title: string;
  description: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
  propertyType: string;
  pricePerNight: string;
  availableDates: {
    start: string;
    end: string;
  };
  amenities: {
    wifi: boolean;
    parking: boolean;
    kitchen: boolean;
    petFriendly: boolean;
    airConditioning: boolean;
    tv: boolean;
    breakfast: boolean;
  };
  photos: File[];
  instantBooking: boolean;
  maxGuests: string;
  bedrooms: string;
  bathrooms: string;
}

export default function CreateListingPage() {
  const router = useRouter();
  const { user, role } = useAuth();
  const [formData, setFormData] = useState<ListingFormData>({
    title: '',
    description: '',
    address: '',
    city: '',
    country: '',
    postalCode: '',
    propertyType: '',
    pricePerNight: '',
    availableDates: {
      start: '',
      end: '',
    },
    amenities: {
      wifi: false,
      parking: false,
      kitchen: false,
      petFriendly: false,
      airConditioning: false,
      tv: false,
      breakfast: false,
    },
    photos: [],
    instantBooking: false,
    maxGuests: '',
    bedrooms: '',
    bathrooms: '',
  });

  const [dragging, setDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const propertyTypes = [
    'Apartment', 'House', 'Villa', 'Cabin', 'Condo',
    'Townhouse', 'Studio', 'Loft', 'Bungalow', 'Farm Stay',
    'Treehouse', 'Boat', 'Camper/RV', 'Hotel', 'Guesthouse'
  ];

  const handleInputChange = (field: keyof ListingFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAmenityChange = (amenity: keyof ListingFormData['amenities']) => {
    setFormData(prev => ({
      ...prev,
      amenities: {
        ...prev.amenities,
        [amenity]: !prev.amenities[amenity],
      },
    }));
  };

  const handleDateChange = (field: 'start' | 'end', value: string) => {
    setFormData(prev => ({
      ...prev,
      availableDates: {
        ...prev.availableDates,
        [field]: value,
      },
    }));
  };

  const handleFileSelect = (files: FileList) => {
    const newFiles = Array.from(files).slice(0, 10 - formData.photos.length);
    
    // Validate files using Cloudinary utility
    const validationErrors: string[] = [];
    const validFiles = newFiles.filter(file => {
      const validation = validateImageFile(file, 10); // 10MB max
      if (!validation.isValid) {
        validationErrors.push(`${file.name}: ${validation.error}`);
        return false;
      }
      return true;
    });
    
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
    }
    
    if (validFiles.length === 0) return;
    
    const newPhotos = [...formData.photos, ...validFiles];
    
    setFormData(prev => ({
      ...prev,
      photos: newPhotos,
    }));

    // Create preview URLs
    const newPreviewUrls = validFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => [...prev, ...newPreviewUrls]);

    // Simulate upload progress
    const newProgress = validFiles.map(() => 0);
    setUploadProgress(prev => [...prev, ...newProgress]);

    // Simulate upload completion
    setTimeout(() => {
      setUploadProgress(prev => prev.map(p => 100));
    }, 1500);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = [...formData.photos];
    const newPreviewUrls = [...previewUrls];
    const newProgress = [...uploadProgress];

    newPhotos.splice(index, 1);
    newPreviewUrls.splice(index, 1);
    newProgress.splice(index, 1);

    // Revoke object URL to prevent memory leaks
    URL.revokeObjectURL(previewUrls[index]);

    setFormData(prev => ({
      ...prev,
      photos: newPhotos,
    }));
    setPreviewUrls(newPreviewUrls);
    setUploadProgress(newProgress);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setErrors([]);
    
    // Check authentication
    if (!user) {
      setErrors(['Please login to create a listing']);
      setTimeout(() => router.push('/auth/login'), 2000);
      return;
    }

    if (role !== 'host') {
      setErrors(['Only hosts can create listings. Please sign up as a host.']);
      return;
    }
    
    // Validate required fields
    const validationErrors: string[] = [];
    if (!formData.title) validationErrors.push('Listing title is required');
    if (!formData.description) validationErrors.push('Description is required');
    if (!formData.address) validationErrors.push('Address is required');
    if (!formData.city) validationErrors.push('City is required');
    if (!formData.country) validationErrors.push('Country is required');
    if (!formData.propertyType) validationErrors.push('Property type is required');
    if (!formData.pricePerNight) validationErrors.push('Price per night is required');
    if (!formData.photos.length) validationErrors.push('At least one photo is required');
    
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    try {
      setSubmitting(true);

      // Debug: Log user authentication state
      console.log('🔍 User Auth State:', {
        uid: user?.uid,
        email: user?.email,
        displayName: user?.displayName,
        role: role,
        emailVerified: user?.emailVerified
      });

      // Upload images using Cloudinary utility
      console.log(`🚀 Starting upload of ${formData.photos.length} images...`);
      
      const imageUrls = await uploadMultipleImages(
        formData.photos,
        { 
          folder: 'staynestly/properties',
          tags: ['property', formData.propertyType, formData.city]
        },
        (current, total, url) => {
          console.log(`✅ Uploaded image ${current}/${total}: ${url}`);
          // Update progress for UI feedback
          const progress = (current / total) * 100;
          setUploadProgress(prev => {
            const newProgress = [...prev];
            newProgress[current - 1] = progress;
            return newProgress;
          });
        }
      );
      
      console.log(`✅ All ${imageUrls.length} images uploaded successfully!`);

      // Create property document in Firestore
      const propertyData = {
        title: formData.title,
        description: formData.description,
        address: formData.address,
        city: formData.city,
        country: formData.country,
        postalCode: formData.postalCode,
        location: `${formData.city}, ${formData.country}`,
        propertyType: formData.propertyType,
        pricePerNight: parseFloat(formData.pricePerNight),
        price: parseFloat(formData.pricePerNight),
        availableDates: formData.availableDates,
        amenities: formData.amenities,
        instantBooking: formData.instantBooking,
        maxGuests: parseInt(formData.maxGuests) || 1,
        bedrooms: parseInt(formData.bedrooms) || 1,
        bathrooms: parseInt(formData.bathrooms) || 1,
        images: imageUrls,
        imageUrl: imageUrls[0] || '',
        ownerId: user.uid,
        ownerEmail: user.email,
        ownerName: user.displayName || user.email,
        status: 'active',
        rating: 0,
        reviews: 0,
        bookings: 0,
        isFeatured: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      console.log('📝 Attempting to create property with data:', propertyData);
      console.log('🔐 User UID:', user.uid);

      const docRef = await addDoc(collection(db, 'properties'), propertyData);
      
      console.log('✅ Property created successfully with ID:', docRef.id);

      // Clean up object URLs
      previewUrls.forEach(url => URL.revokeObjectURL(url));

      // Show success and redirect
      router.push('/dashboard');
    } catch (error: any) {
      console.error('❌ Error creating listing:', error);
      console.error('Error code:', error?.code);
      console.error('Error message:', error?.message);
      console.error('Full error:', JSON.stringify(error, null, 2));
      
      let errorMessage = 'Failed to create listing. Please try again.';
      
      if (error?.code === 'permission-denied') {
        errorMessage = 'Permission denied. Please check Firestore security rules.';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      setErrors([errorMessage]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  const amenitiesList = [
    { key: 'wifi' as const, label: 'WiFi', icon: Wifi, color: 'bg-blue-100 text-blue-600' },
    { key: 'parking' as const, label: 'Parking', icon: Car, color: 'bg-green-100 text-green-600' },
    { key: 'kitchen' as const, label: 'Kitchen', icon: Utensils, color: 'bg-orange-100 text-orange-600' },
    { key: 'petFriendly' as const, label: 'Pet Friendly', icon: PawPrint, color: 'bg-purple-100 text-purple-600' },
    { key: 'airConditioning' as const, label: 'Air Conditioning', icon: Wind, color: 'bg-cyan-100 text-cyan-600' },
    { key: 'tv' as const, label: 'TV', icon: Tv, color: 'bg-red-100 text-red-600' },
    { key: 'breakfast' as const, label: 'Breakfast', icon: Coffee, color: 'bg-yellow-100 text-yellow-600' },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Create a New Listing
          </h1>
          <p className="text-gray-600 text-lg">
            Share your space with travelers from around the world
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Error Messages */}
          {errors.length > 0 && (
            <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-xl p-6 animate-in slide-in-from-top">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <X className="w-6 h-6 text-red-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-red-900 mb-2">Please fix the following errors:</h3>
                  <ul className="space-y-1">
                    {errors.map((error, index) => (
                      <li key={index} className="text-red-700 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={() => setErrors([])}
                  className="flex-shrink-0 text-red-400 hover:text-red-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column - Basic Info */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Property Details Card */}
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl">
                    <Home className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Property Details</h2>
                    <p className="text-gray-500">Tell us about your space</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                      Listing Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="Cozy apartment with mountain view"
                      className="w-full px-5 py-3.5 text-lg border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Describe your space, nearby attractions, and what makes it special..."
                      rows={5}
                      className="w-full px-5 py-3.5 text-lg border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all resize-none"
                      required
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      Share what makes your place unique
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-3">
                        Address <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="text"
                          value={formData.address}
                          onChange={(e) => handleInputChange('address', e.target.value)}
                          placeholder="123 Main Street"
                          className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-3">
                        City <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        placeholder="New York"
                        className="w-full px-5 py-3.5 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-3">
                        Country <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Globe className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="text"
                          value={formData.country}
                          onChange={(e) => handleInputChange('country', e.target.value)}
                          placeholder="United States"
                          className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-3">
                        Postal Code
                      </label>
                      <input
                        type="text"
                        value={formData.postalCode}
                        onChange={(e) => handleInputChange('postalCode', e.target.value)}
                        placeholder="10001"
                        className="w-full px-5 py-3.5 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-3">
                        Property Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.propertyType}
                        onChange={(e) => handleInputChange('propertyType', e.target.value)}
                        className="w-full px-5 py-3.5 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all appearance-none bg-white"
                        required
                      >
                        <option value="">Select type</option>
                        {propertyTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-3">
                        Bedrooms
                      </label>
                      <div className="relative">
                        <BedIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="number"
                          min="0"
                          value={formData.bedrooms}
                          onChange={(e) => handleInputChange('bedrooms', e.target.value)}
                          placeholder="2"
                          className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-3">
                        Bathrooms
                      </label>
                      <div className="relative">
                        <BathIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={formData.bathrooms}
                          onChange={(e) => handleInputChange('bathrooms', e.target.value)}
                          placeholder="1.5"
                          className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Photos Upload Card */}
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                    <ImageIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Photos</h2>
                    <p className="text-gray-500">Upload high-quality photos of your property</p>
                  </div>
                </div>

                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-3 border-dashed rounded-2xl p-12 text-center transition-all ${
                    dragging 
                      ? 'border-orange-500 bg-orange-50 border-4' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="max-w-md mx-auto">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <Upload className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Drag & drop or click to add photos
                    </h3>
                    <p className="text-gray-500 mb-6">
                      Upload at least 1 photo. JPG, PNG up to 5MB each.
                    </p>
                    <label className="inline-block px-8 py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all cursor-pointer shadow-lg">
                      Browse Files
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Photo Previews */}
                {formData.photos.length > 0 && (
                  <div className="mt-8">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-900">
                        Uploaded Photos ({formData.photos.length}/10)
                      </h4>
                      <span className="text-sm text-gray-500">
                        Click on photo to remove
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {formData.photos.map((photo, index) => (
                        <div key={index} className="relative group">
                          <div className="aspect-square rounded-xl overflow-hidden border-2 border-gray-200">
                            {/* Using img tag for blob URLs */}
                            <img
                              src={previewUrls[index]}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={() => removePhoto(index)}
                                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          {/* Upload Progress Bar */}
                          {uploadProgress[index] < 100 && (
                            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gray-200 rounded-b-xl overflow-hidden">
                              <div 
                                className="h-full bg-green-500 transition-all duration-500"
                                style={{ width: `${uploadProgress[index]}%` }}
                              ></div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Settings & Actions */}
            <div className="space-y-8">
              
              {/* Pricing & Availability Card */}
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Pricing & Availability</h2>
                    <p className="text-gray-500">Set your rates and availability</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                      Price per Night <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.pricePerNight}
                        onChange={(e) => handleInputChange('pricePerNight', e.target.value)}
                        placeholder="0.00"
                        className="w-full pl-12 pr-4 py-3.5 text-xl border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                      Available Dates
                    </label>
                    <div className="space-y-4">
                      <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="date"
                          value={formData.availableDates.start}
                          onChange={(e) => handleDateChange('start', e.target.value)}
                          className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all"
                        />
                      </div>
                      <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="date"
                          value={formData.availableDates.end}
                          onChange={(e) => handleDateChange('end', e.target.value)}
                          className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                      Maximum Guests
                    </label>
                    <div className="relative">
                      <Users className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="number"
                        min="1"
                        value={formData.maxGuests}
                        onChange={(e) => handleInputChange('maxGuests', e.target.value)}
                        placeholder="4"
                        className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all"
                      />
                    </div>
                  </div>

                  {/* Instant Booking Toggle */}
                  <div className="pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg">
                          <Key className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Instant Booking</p>
                          <p className="text-sm text-gray-500">
                            Guests can book without approval
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({...prev, instantBooking: !prev.instantBooking}))}
                        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                          formData.instantBooking ? 'bg-orange-500' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                            formData.instantBooking ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Amenities Card */}
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Amenities</h2>
                    <p className="text-gray-500">Select what your property offers</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {amenitiesList.map((amenity) => {
                    const Icon = amenity.icon;
                    const isSelected = formData.amenities[amenity.key];
                    return (
                      <button
                        key={amenity.key}
                        type="button"
                        onClick={() => handleAmenityChange(amenity.key)}
                        className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-3 relative ${
                          isSelected 
                            ? `${amenity.color.replace('bg-', 'border-')} border-2 bg-opacity-20` 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className={`p-3 rounded-lg ${isSelected ? amenity.color : 'bg-gray-100'}`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <span className="font-medium text-gray-900">{amenity.label}</span>
                        {isSelected && (
                          <Check className="w-5 h-5 text-green-500 absolute top-2 right-2" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-gray-900 to-black rounded-2xl p-6 text-white">
                  <h3 className="font-bold text-lg mb-2">Ready to Publish?</h3>
                  <p className="text-gray-300 text-sm mb-4">
                    Your listing will be reviewed and activated within 24 hours
                  </p>
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="w-4 h-4 text-green-400" />
                    <span>Secure payment processing</span>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-6 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Publishing...
                      </>
                    ) : (
                      <>
                        <TagIcon className="w-5 h-5" />
                        Publish Listing
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
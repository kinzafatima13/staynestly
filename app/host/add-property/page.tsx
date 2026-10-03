"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UploadCloud, CheckCircle, Loader2 } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';

export default function AddPropertyPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    city: '',
    price: '',
    description: '',
    lat: null as number | null,
    lng: null as number | null,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      alert('You must be logged in to add a property');
      return;
    }

    setLoading(true);

    try {
      let imageUrl = 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=800';

      // Upload image to Firebase Storage if provided
      if (imageFile) {
        const imageRef = ref(storage, `properties/${user.uid}/${Date.now()}_${imageFile.name}`);
        await uploadBytes(imageRef, imageFile);
        imageUrl = await getDownloadURL(imageRef);
      }

      // Create the new property object
      const newProperty = {
        title: formData.title,
        city: formData.city,
        price: Number(formData.price),
        rating: 5.0,
        images: [imageUrl],
        description: formData.description,
        amenities: ['Wifi', 'Parking', 'Kitchen'],
        ownerId: user.uid,
        ownerName: user.displayName || user.email,
        createdAt: serverTimestamp(),
        available: true,
        featured: false,
        lat: formData.lat || null,
        lng: formData.lng || null,
      };

      // Save to Firestore
      await addDoc(collection(db, 'properties'), newProperty);

      alert('Property added successfully!');
      router.push('/dashboard');
    } catch (error) {
      console.error('Error adding property:', error);
      alert('Failed to add property. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8 border border-gray-100">

        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-800">List Your Property</h1>
          <p className="text-slate-500 mt-2">Earn money by sharing your home with travelers.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Property Title</label>
            <input
              required
              name="title"
              placeholder="e.g. Modern Sunset Apartment"
              value={formData.title}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* City */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">City / Location</label>
              <input
                required
                name="city"
                placeholder="e.g. Miami, FL"
                value={formData.city}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                onChange={handleChange}
              />
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Price per Night ($)</label>
              <input
                required
                type="number"
                min="1"
                name="price"
                placeholder="150"
                value={formData.price}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              required
              name="description"
              placeholder="Describe your property..."
              rows={4}
              value={formData.description}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              onChange={handleChange}
            />
          </div>

          {/* Property Location */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Property Location</label>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => {
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                      (position) => {
                        setFormData(prev => ({
                          ...prev,
                          lat: position.coords.latitude,
                          lng: position.coords.longitude
                        }));
                        alert("Location captured! " + position.coords.latitude.toFixed(4) + ", " + position.coords.longitude.toFixed(4));
                      },
                      (error) => alert("Could not fetch location: " + error.message)
                    );
                  } else {
                    alert("Geolocation is not supported by your browser.");
                  }
                }}
                className="flex items-center justify-center gap-2 p-3 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                Use My Current Location (Recommended)
              </button>
              {formData.lat && formData.lng && (
                <p className="text-xs text-green-600 font-medium text-center">
                  Location Coordinates Locked With Success ✅
                </p>
              )}
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Property Image</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
              {imagePreview ? (
                <div className="relative">
                  <img src={imagePreview} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
                  <button
                    type="button"
                    onClick={() => { setImageFile(null); setImagePreview(''); }}
                    className="mt-2 text-red-600 hover:text-red-700 text-sm"
                  >
                    Remove Image
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <UploadCloud className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 mb-1">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-400">PNG, JPG up to 10MB</p>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </label>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-blue-500/30 flex justify-center items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                List Property Now <CheckCircle className="w-5 h-5" />
              </>
            )}
          </button>

        </form>
      </div>
    </div>
  );
}
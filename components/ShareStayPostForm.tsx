// components/ShareStayPostForm.tsx

"use client";
import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react'; 
// --- FIREBASE IMPORTS FOR PUBLISHING ---
import { collection, addDoc } from 'firebase/firestore'; 
import { db } from '@/lib/firebase'; // Assumes your Firestore instance is exported as 'db'
// ---------------------------------------

// Define the interface for your form data (good practice for TypeScript)
interface FormDataType {
    city: string;
    age: string;
    gender: string;
    moveInDate: string;
    description: string;
}

export default function ShareStayPostForm() {
    // 1. State to capture input values
    const [formData, setFormData] = useState<FormDataType>({
        city: '',
        age: '',
        gender: '',
        moveInDate: '',
        description: '',
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState('');

    // Function to handle changes in input fields
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        setMessage(''); // Clear message when user starts typing again
    };

    // 2. Function to handle the form submission (REAL FIREBASE PUBLISHING)
    const handlePublish = async (e: React.FormEvent) => {
        e.preventDefault(); 
        
        // --- Validation ---
        if (formData.city === '' || formData.description === '') {
            setMessage('Please fill out the city and description fields.');
            return;
        }

        setIsSubmitting(true);
        setMessage('Publishing request...');
        
        try {
            // 1. Get a reference to the 'shareStays' collection
            const collectionRef = collection(db, 'shareStays');

            // 2. Use addDoc to save the form data
            await addDoc(collectionRef, {
                ...formData,
                // Add server-side metadata
                createdAt: new Date().toISOString(), // Standard timestamp
                status: 'active',
                // Add your user ID here if user authentication is ready
            });

            setMessage('✅ Success! Your ShareStay request has been published to Firebase.');
            
            // Clear the form fields after successful submission
            setFormData({ city: '', age: '', gender: '', moveInDate: '', description: '' });

        } catch (error) {
            console.error("Error publishing ShareStay request:", error);
            setMessage('❌ Error: Failed to publish request. Check your console for details.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handlePublish} className="p-8 md:p-12 bg-white rounded-2xl shadow-2xl border border-blue-200">
            <h3 className="text-3xl font-bold text-slate-800 mb-6">Publish Your Roommate Request</h3>
            <p className="text-lg text-slate-600 mb-8">
                Tell us about your ideal share situation and the kind of partner you're looking for.
            </p>

            {/* Input fields linked to state */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input type="text" name="city" placeholder="Desired City/Area" value={formData.city} onChange={handleChange} className="p-4 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"/>
                <input type="number" name="age" placeholder="Preferred Partner Age (e.g., 25)" value={formData.age} onChange={handleChange} className="p-4 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"/>
                
                <select name="gender" value={formData.gender} onChange={handleChange} className="p-4 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-slate-600">
                    <option value="" disabled>Preferred Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="any">Any</option>
                </select>
                
                <input type="date" name="moveInDate" value={formData.moveInDate} onChange={handleChange} className="p-4 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"/>
            </div>

            <textarea 
                name="description"
                placeholder="Describe your request and living style (required)"
                rows={4}
                value={formData.description}
                onChange={handleChange}
                className="w-full mt-6 p-4 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            ></textarea>
            
            {/* Status Message */}
            {message && (
                <p className={`mt-4 text-center font-medium ${message.includes('Success') ? 'text-green-600' : 'text-red-600'}`}>
                    {message}
                </p>
            )}

            {/* Submission Button */}
            <button 
                type="submit"
                disabled={isSubmitting}
                className={`mt-8 w-full flex items-center justify-center gap-2 font-extrabold py-4 rounded-xl shadow-lg transition-colors text-lg ${
                    isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/50'
                }`}
            >
                {isSubmitting ? 'Publishing...' : (
                    <>
                        Publish Request <ArrowRight className="w-5 h-5"/>
                    </>
                )}
            </button>
        </form>
    );
}
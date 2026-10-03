import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface Roommate {
    id: string;
    name: string;
    age: number | string;
    gender: string;
    location: {
        lat: number;
        lng: number;
    };
    bio: string;
    budget: {
        min: number;
        max: number;
    };
    moveInDate?: string;
    interests: string[];
    distance?: number;
    whatsappNumber?: string;
    image: string;
    isActive?: boolean;
    lastSeen?: string;
    email?: string;
    isLookingForRoommate?: boolean;
}

export async function fetchRoommates(currentUserId?: string): Promise<Roommate[]> {
    try {
        const usersRef = collection(db, 'users');
        // Fetch users who are explicitly looking for a roommate
        const q = query(usersRef, where('isLookingForRoommate', '==', true));

        const querySnapshot = await getDocs(q);
        const roommates: Roommate[] = [];

        querySnapshot.forEach((doc) => {
            // Skip current user
            if (doc.id === currentUserId) return;

            const data = doc.data();

            // Check availability
            if (data.busyUntil) {
                const busyUntilDate = data.busyUntil.toDate ? data.busyUntil.toDate() : new Date(data.busyUntil);
                if (busyUntilDate > new Date()) {
                    return; // User is busy
                }
            }

            // Ensure location exists before adding
            if (data.locationCoordinates && data.locationCoordinates.lat && data.locationCoordinates.lng) {
                roommates.push({
                    id: doc.id,
                    name: data.name || 'Anonymous User',
                    age: data.age || 25,
                    gender: data.gender || 'Other',
                    location: data.locationCoordinates,
                    bio: data.bio || 'No bio provided.',
                    budget: data.budget || { min: 0, max: 0 },
                    interests: data.interests || [],
                    image: data.photoURL || data.image || 'https://via.placeholder.com/150',
                    email: data.email,
                    isLookingForRoommate: data.isLookingForRoommate,
                    distance: undefined // Calculated later
                });
            }
        });

        return roommates;
    } catch (error) {
        console.error("Error fetching roommates from Firestore:", error);
        return [];
    }
}

export const MOCK_ROOMMATES: Roommate[] = [
    {
        id: '1',
        name: 'Sarah S.',
        age: 24,
        gender: 'Female',
        location: { lat: 40.7128, lng: -74.0060 },
        bio: 'Digital nomad working in tech. Love hiking, yoga, and trying new coffee shops. Looking for a quiet, clean space in Brooklyn.',
        budget: { min: 1200, max: 1800 },
        moveInDate: '2024-03-15',
        interests: ['Yoga', 'Hiking', 'Coffee', 'Tech'],
        whatsappNumber: '+1234567890',
        image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?auto=format&fit=crop&q=80&w=300',
        isActive: true,
        lastSeen: 'Just now',
        email: 'sarah.s@example.com'
    },
    {
        id: '2',
        name: 'John S.',
        age: 28,
        gender: 'Male',
        location: { lat: 40.7589, lng: -73.9851 },
        bio: 'Medical resident at NYU. Need a room near the hospital. Clean, organized, and respectful of shared spaces.',
        budget: { min: 1000, max: 1500 },
        moveInDate: '2024-03-20',
        interests: ['Medicine', 'Running', 'Cooking', 'Reading'],
        whatsappNumber: '+1234567891',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
        isActive: true,
        lastSeen: '5 min ago',
        email: 'john.s@example.com'
    },
    {
        id: '3',
        name: 'Alex M.',
        age: 26,
        gender: 'Other',
        location: { lat: 40.7505, lng: -73.9934 },
        bio: 'Artist and freelance designer. Looking for creative, pet-friendly space. I have a friendly cat named Luna.',
        budget: { min: 900, max: 1300 },
        moveInDate: '2024-04-01',
        interests: ['Art', 'Design', 'Cats', 'Photography'],
        whatsappNumber: '+1234567892',
        image: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&q=80&w=300',
        isActive: false,
        lastSeen: '2 hours ago',
        email: 'alex.m@example.com'
    },
    {
        id: '4',
        name: 'Maria K.',
        age: 22,
        gender: 'Female',
        location: { lat: 40.7295, lng: -73.9965 },
        bio: 'Graduate student at NYU. Looking for a study-friendly environment. Love cooking and board games!',
        budget: { min: 800, max: 1200 },
        moveInDate: '2024-03-25',
        interests: ['Studying', 'Cooking', 'Board Games', 'Movies'],
        whatsappNumber: '+1234567893',
        image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
        isActive: true,
        lastSeen: 'Just now',
        email: 'maria.k@example.com'
    },
    {
        id: '5',
        name: 'David L.',
        age: 30,
        gender: 'Male',
        location: { lat: 40.6782, lng: -73.9442 },
        bio: 'Software engineer working from home. Need stable internet and quiet workspace. Night owl, but respectful.',
        budget: { min: 1100, max: 1600 },
        moveInDate: '2024-04-10',
        interests: ['Coding', 'Gaming', 'Gym', 'Tech Talks'],
        whatsappNumber: '+1234567894',
        image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300',
        isActive: true,
        lastSeen: '15 min ago',
        email: 'david.l@example.com'
    }
];

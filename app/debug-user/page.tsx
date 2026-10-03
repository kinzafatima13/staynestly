"use client";
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function DebugUserPage() {
    const { user, role, loading } = useAuth();
    const [firestoreData, setFirestoreData] = useState<any>(null);
    const [fsLoading, setFsLoading] = useState(false);

    useEffect(() => {
        const fetchFirestoreData = async () => {
            if (!user) return;
            setFsLoading(true);
            try {
                const docRef = doc(db, 'users', user.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setFirestoreData(docSnap.data());
                } else {
                    setFirestoreData({ error: 'Document does not exist' });
                }
            } catch (err: any) {
                setFirestoreData({ error: err.message });
            } finally {
                setFsLoading(false);
            }
        };

        if (user) {
            fetchFirestoreData();
        }
    }, [user]);

    if (loading) return <div>Loading Auth...</div>;
    if (!user) return <div>Not Logged In</div>;

    return (
        <div className="p-10 font-mono">
            <h1 className="text-2xl font-bold mb-4">Debug User Role</h1>

            <div className="border p-4 mb-4 rounded bg-gray-50">
                <h2 className="font-bold">Auth Context</h2>
                <p>UID: {user.uid}</p>
                <p>Email: {user.email}</p>
                <p>Role (from Context): <span className="bg-yellow-200 px-1">{role || 'null'}</span></p>
            </div>

            <div className="border p-4 mb-4 rounded bg-gray-50">
                <h2 className="font-bold">Firestore Data (users/{user.uid})</h2>
                {fsLoading ? (
                    <p>Loading Firestore data...</p>
                ) : (
                    <pre className="bg-gray-100 p-2 rounded mt-2">
                        {JSON.stringify(firestoreData, null, 2)}
                    </pre>
                )}
            </div>

            <div className="mt-4">
                <a href="/dashboard" className="text-blue-600 underline mr-4">Go to Dashboard</a>
                <a href="/" className="text-blue-600 underline">Go Home</a>
            </div>
        </div>
    );
}

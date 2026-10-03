"use client";
import { ReactNode, createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { UserRole } from '@/lib/auth';
import { doc } from 'firebase/firestore';

interface AuthContextValue {
  user: User | null;
  role: UserRole | null;
  loading: boolean;
  profileComplete: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  role: null,
  loading: true,
  profileComplete: false,
  logout: async () => { }
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileComplete, setProfileComplete] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }, [router]);

  useEffect(() => {
    let unsubscribeUserDoc: (() => void) | null = null;

    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        if (unsubscribeUserDoc) {
          unsubscribeUserDoc();
          unsubscribeUserDoc = null;
        }
        setUser(null);
        setRole(null);
        setLoading(false);
        setProfileComplete(false);
        return;
      }

      setUser(u);

      // Subscribe to user document for real-time updates
      // This handles the case where the user document is created slightly after auth (during signup)
      try {
        const { onSnapshot, doc } = await import('firebase/firestore');
        const userDocRef = doc(db, 'users', u.uid);

        unsubscribeUserDoc = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setRole(data.role as UserRole);
            setProfileComplete(true);
          } else {
            // Profile doesn't exist yet (might be created shortly during signup)
            setRole(null);
            setProfileComplete(false);

            // Redirect if needed
            const isAuthPage = ['/login', '/signup', '/auth'].some(path =>
              pathname?.startsWith(path)
            );
            if (!isAuthPage && pathname !== '/complete-profile') {
              router.push('/complete-profile');
            }
          }
          setLoading(false);
        }, (error) => {
          console.error('Error listening to user profile:', error);
          setLoading(false);
        });

      } catch (error) {
        console.error('Error setting up user profile listener:', error);
        setLoading(false);
      }
    });

    return () => {
      unsub();
      if (unsubscribeUserDoc) {
        unsubscribeUserDoc();
      }
    };
  }, [router, pathname]);

  const value = useMemo(() => ({
    user,
    role,
    loading,
    profileComplete,
    logout
  }), [user, role, loading, profileComplete, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
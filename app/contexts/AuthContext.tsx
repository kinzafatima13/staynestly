// app/contexts/AuthContext.tsx
"use client";
import { ReactNode, createContext, useContext, useState } from 'react';

interface AuthState {
  user: any | null;
  role: string | null;
  loading: boolean;
  profileComplete: boolean;
}

// Create the context
const AuthContext = createContext<AuthState>({ 
  user: null, 
  role: null, 
  loading: false,
  profileComplete: true
});

// Create the provider
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ 
    user: null, 
    role: null, 
    loading: false,
    profileComplete: true
  });

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

// Create the hook
export function useAuth() {
  return useContext(AuthContext);
}
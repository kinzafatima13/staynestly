"use client";
import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // 1. Hide everything on Auth pages
  const hideChrome = pathname?.startsWith('/auth');
  
  // 2. Detect Home Page
  const isHomePage = pathname === '/';

  if (hideChrome) {
    return <>{children}</>;
  }

  return (
    <>
      {/* Hide Global Navbar on Home if you have a manual one there */}
      {!isHomePage && <Navbar />}
      
      <div className="min-h-[70vh]">{children}</div>

      {/* FIX: Hide Global Footer on Home so the duplicate "lower" one is removed */}
      {!isHomePage && <Footer />}
    </>
  );
}
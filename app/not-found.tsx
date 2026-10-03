"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  useEffect(() => {
    // Automatically redirect to the home page
    router.replace("/");
  }, [router]);

  // Return null so nothing renders while redirecting
  return null;
}
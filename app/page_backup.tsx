"use client";

console.log("--------------------page.tsx Mounted-----------------------");

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

// Dynamically import components with SSR disabled
const DynamicLandingPage = dynamic(() => import("@/components/LandingPage"), { ssr: false });
const DynamicUserDashboardPage = dynamic(() => import("@/components/UserDashboardPage"), { ssr: false });

export default function HomePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  

  useEffect(() => {
    console.log("--------------------page.tsx HomePage()-----------------------");

     // Set userId for testing purposes
     console.log("Setting test userId in localStorage...");
     localStorage.setItem("userId", "b5efc35e-3b1d-478c-a5bb-af8c68176dfc");

    // Simulate checking localStorage
    const storedUserId = localStorage.getItem("userId");
    console.log("Retrieved userId:", storedUserId || "No userId found");

    // Update state
    setUserId(storedUserId);
    setIsLoading(false); // Mark loading complete
  }, []);

  if (isLoading) {
    console.log("--------------------page.tsx isLoading-----------------------");
    return <div>Loading...</div>; // Show loading spinner until `userId` is resolved
  }

  console.log("userId", userId);

  return userId ? (
    <DynamicUserDashboardPage userId={userId} />
  ) : (
    <DynamicLandingPage />
  );
}

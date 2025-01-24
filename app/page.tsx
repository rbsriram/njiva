"use client";
console.log("--------------------/app/page.tsx Mounted-----------------------");
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

// Dynamically import components with SSR disabled
const DynamicLandingPage = dynamic(() => import("@/components/LandingPage"), { ssr: false });
const DynamicUserDashboardPage = dynamic(() => import("@/components/UserDashboardPage"), { ssr: false });

export default function HomePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      // Retrieve `userId` from URL query or localStorage
      const urlParams = new URLSearchParams(window.location.search);
      const queryUserId = urlParams.get("user_id");
      const storedUserId = localStorage.getItem("userId");

      if (queryUserId) {
        // Save `userId` from URL query to localStorage and clean the URL
        localStorage.setItem("userId", queryUserId);
        setUserId(queryUserId);
        router.replace("/dashboard"); // Clean query parameters
      } else if (storedUserId) {
        // Use `userId` from localStorage
        setUserId(storedUserId);
      }

      setIsLoading(false); // Mark loading complete
    };

    checkUser();
  }, [router]);

  if (isLoading) {
    return <div>Loading...</div>; // Show loading spinner while processing
  }

  return userId ? (
    <DynamicUserDashboardPage userId={userId} />
  ) : (
    <DynamicLandingPage />
  );
}

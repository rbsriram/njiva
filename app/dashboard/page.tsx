"use client";
console.log("--------------------/app/dashboard/page.tsx Mounted-----------------------");
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import UserDashboardPage from "@/components/UserDashboardPage";

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const queryUserId = searchParams.get("user");
    const storedUserId = localStorage.getItem("userId");

    if (queryUserId) {
      setUserId(queryUserId);
      localStorage.setItem("userId", queryUserId); // Persist userId
    } else if (storedUserId) {
      setUserId(storedUserId);
    } else {
      router.push("/"); // Redirect to Landing Page if no userId is found
    }
  }, [router, searchParams]);

  if (!userId) {
    return <div>Loading...</div>; // Loading state while checking userId
  }

  console.log("Dashboard loaded for userId:", userId); // Debug log

  return <UserDashboardPage userId={userId} />;
}

/**
 * Organized Data API Route
 * -------------------------
 * Purpose:
 * - Fetch and group the user's entries from the `organized_entries` table in Supabase.
 * - The grouped data includes categories such as `do`, `plan`, `think`, `shopping`, `upcoming`, and `important_dates_events`.
 * 
 * HTTP Method: GET
 * 
 * Key Functionalities:
 * - Retrieve all entries from the `organized_entries` table based on the `user_id`.
 * - Group entries by their `type` field into specific categories.
 * - Return a JSON response with categorized data.
 * 
 * Dependencies:
 * - Supabase for database interaction.
 * - Next.js API Routes for serverless execution.
 */

console.log("--------------------/organized/Route.ts Component Mounted-----------------------");

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Format Date
 * -------------
 * Converts `date` to a readable string or defaults to 'Today'.
 * @param date - Raw date string from the database.
 * @returns Formatted date or 'Today'.
 */
const formatDate = (date: string | null) => {
  if (date) {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
  return 'Today';
};

/**
 * Format Time
 * ------------
 * Returns time or null if not provided.
 * @param time - Raw time string from the database.
 * @returns Time string or null.
 */
const formatTime = (time: string | null) => (time ? time : null);

/**
 * GET API Handler
 * ---------------
 * Handles GET requests to fetch categorized data for the user.
 * @param request - The incoming NextRequest.
 * @returns A JSON response with the grouped and formatted data or an error message.
 */
export async function GET(request: NextRequest) {
  console.log("✅ GET request to /api/organized received");

  try {
    // Extract the user_id from the headers (sent from the frontend)
    const userId = request.headers.get("user-id");

    if (!userId || isNaN(Number(userId))) {
      return NextResponse.json(
        { success: false, error: "User is not authenticated or invalid user_id." },
        { status: 401 }
      );
    }

    // Fetch data from the organized_entries table for the given user_id
    const { data, error } = await supabase
      .from("organized_entries")
      .select("*")
      .eq("user_id", Number(userId)); // Filter by user_id

    if (error) {
      console.error("❌ Failed to fetch organized data:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Transform data with proper date and time formatting
    const transformTask = (task: any) => ({
      id: task.id,
      title: task.content || "Untitled Task",
      completed: task.completed || false,
      date: formatDate(task.date),
      time: formatTime(task.time),
      day: task.day || null,
    });

    // Group data based on their type
    const organizedData = {
      do: data.filter((item) => item.type === "do").map(transformTask),
      plan: data.filter((item) => item.type === "plan").map(transformTask),
      think: data.filter((item) => item.type === "think").map(transformTask),
      shopping: data.filter((item) => item.type === "shopping_list").map(transformTask),
      upcoming: data.filter((item) => item.type === "upcoming").map(transformTask),
      importantDates: data.filter((item) => item.type === "important_dates_events").map(transformTask),
    };

    console.log("✅ Successfully fetched and grouped organized data:", organizedData);

    return NextResponse.json({ success: true, data: organizedData });

  } catch (error: any) {
    console.error("❌ Error in GET handler:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

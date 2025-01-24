// app/api/complete-task/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ✅ Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * ✅ API to Mark Task as Complete
 * -------------------------------
 * Purpose:
 * - Update the `completed` column for a specific task in the `organized_data` table.
 *
 * Expected Payload:
 * - `id`: Task ID to be marked as complete.
 * - `completed`: Boolean flag to indicate the task's completion status.
 *
 * Response:
 * - `{ success: true }` on successful update.
 * - `{ success: false, error: "Error message" }` on failure.
 */
export async function POST(request: NextRequest) {
  try {
    const { id, completed } = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Task ID is required." },
        { status: 400 }
      );
    }

    // ✅ Update task completion status in Supabase
    const { error } = await supabase
      .from("organized_data")
      .update({ completed })
      .eq("id", id);

    if (error) {
      console.error("❌ Failed to update task:", error.message);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    console.log("✅ Task marked as complete in the database");
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("❌ API Error:", error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

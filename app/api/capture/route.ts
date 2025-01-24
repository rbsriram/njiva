
console.log("--------------------/capture/Route.ts Component Mounted-----------------------");

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { note, userId } = await request.json();

    if (!note || !userId) {
      return NextResponse.json(
        { success: false, error: "Missing note or userId" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("pending_entries")
      .insert([{ content: note, user_id: userId }]);

    if (error) {
      console.error("❌ Error inserting data:", error.message);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Unexpected error" },
      { status: 500 }
    );
  }
}

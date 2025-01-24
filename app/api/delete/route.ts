import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const { id, userId } = await request.json();

    if (!id || !userId) {
      return NextResponse.json(
        { success: false, error: "Missing id or userId" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("pending_entries")
      .delete()
      .match({ id, user_id: userId });

    if (error) {
      console.error("Error deleting entry:", error.message);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
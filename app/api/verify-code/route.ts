import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  console.log("--------------------verify-code/route.ts Mounted-----------------------");
  try {
    const { email, accessCode } = await request.json();

    // Validate input
    if (!email || !accessCode) {
      return NextResponse.json({ success: false, error: "Email and access code are required." }, { status: 400 });
    }

    // Query user by email
    const { data: user, error: fetchError } = await supabase
      .from("users")
      .select("user_id, access_code, access_code_expires_at")
      .eq("email", email)
      .single();

    if (fetchError) {
      console.error("Error fetching user:", fetchError.message);
      return NextResponse.json({ success: false, error: "User not found." }, { status: 404 });
    }

    const { user_id, access_code, access_code_expires_at } = user;

    // Check if the access code matches
    if (access_code !== accessCode) {
      return NextResponse.json({ success: false, error: "Invalid access code." }, { status: 401 });
    }

    // Check if the access code has expired
    if (new Date() > new Date(access_code_expires_at)) {
      return NextResponse.json({ success: false, error: "Access code has expired." }, { status: 401 });
    }

    // If successful, return user ID for redirection
    return NextResponse.json({ success: true, userId: user_id });
  } catch (error: any) {
    console.error("Error during code verification:", error.message);
    return NextResponse.json({ success: false, error: "Internal server error." }, { status: 500 });
  }
}

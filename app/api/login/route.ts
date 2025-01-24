/**
 * Login API Route
 * ---------------
 * Purpose:
 * - Handle passwordless authentication for users.
 * - Generate a unique token and send it to the user's email.
 * - Allow users to authenticate by clicking the link sent to their email.
 * 
 * Key Features:
 * - Generate a token for login.
 * - Send a token link to the user's email for authentication.
 * - Store the token temporarily for user validation.
 * 
 * Dependencies:
 * - Supabase for database interaction.
 * - Nodemailer for sending emails.
 * - JWT or similar library for creating tokens.
 */
console.log("--------------------/login/Route.ts Component Mounted-----------------------");

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer"; // For email sending
import jwt from "jsonwebtoken"; // For creating a unique token for login

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * ✅ Generate Login Token
 * - Generates a JWT token for the user.
 * @param email - The user's email address.
 * @returns A JWT token
 */
const generateLoginToken = (email: string): string => {
  return jwt.sign({ email }, process.env.JWT_SECRET!, { expiresIn: "1h" });
};

/**
 * ✅ Send Login Email
 * - Sends a login email with a link containing the JWT token.
 * @param email - The user's email address.
 * @param token - The JWT token.
 * @returns A promise of the email sent result
 */
const sendLoginEmail = async (email: string, token: string) => {
  const transporter = nodemailer.createTransport({
    service: "gmail", // Change to your preferred email service
    auth: {
      user: process.env.EMAIL_USER!,
      pass: process.env.EMAIL_PASSWORD!,
    },
  });

  const loginLink = `${process.env.APP_URL}/login?token=${token}`;

  const mailOptions = {
    from: process.env.EMAIL_USER!,
    to: email,
    subject: "Your Login Link",
    text: `Click the following link to log in to your account: ${loginLink}`,
  };

  return transporter.sendMail(mailOptions);
};

/**
 * POST API Handler
 * ---------------
 * Purpose:
 * - Handles user login by generating a login token.
 * - Sends the token to the user's email.
 * - Stores the token temporarily for future authentication.
 */
export async function POST(request: NextRequest) {
  console.log("🛠️ *POST request to /api/login received*");

  try {
    // 1️⃣ Parse the request body to get the email
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      );
    }

    console.log(`📝 *Email received for login: ${email}*`);

    // 2️⃣ Check if the user exists in the users table
    const { data: existingUser, error: userError } = await supabase
      .from("users")
      .select("id, email")
      .eq("email", email)
      .single();

    if (userError || !existingUser) {
      return NextResponse.json(
        { success: false, error: "User does not exist" },
        { status: 404 }
      );
    }

    console.log(`✅ *User found for email: ${email}*`);

    // 3️⃣ Generate the login token for the user
    const token = generateLoginToken(email);
    console.log(`✅ *Generated token for email: ${email}*`);

    // 4️⃣ Send the login link to the user's email
    await sendLoginEmail(email, token);
    console.log(`✅ *Login email sent to: ${email}*`);

    // 5️⃣ Respond to the client
    return NextResponse.json({
      success: true,
      message: "Login email sent. Check your inbox to log in.",
    });
  } catch (error: any) {
    console.error("❌ *Error in /api/login POST handler:*", error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

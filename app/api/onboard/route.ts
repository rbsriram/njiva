console.log("--------------------onboard/route.ts Mounted-----------------------");

/**
 * Onboard Route:
 * - Handles new user creation or existing user "sign in" (with signIn=true).
 * - No more "Hi friend," or "Welcome back friend" fallback text.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";


const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function generateAccessCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export async function POST(request: NextRequest) {
  console.log("--------------------Processing POST request in onboard/route.ts-----------------------");

  try {
    const { email, firstName, signIn } = await request.json();

    // Basic input check
    if (!email || (!signIn && !firstName)) {
      return NextResponse.json(
        { success: false, error: "Email and first name are required" },
        { status: 400 }
      );
    }

    // Look up user by email
    const { data: existingUser, error: fetchError } = await supabase
      .from("users")
      .select("user_id, first_name, access_code, access_code_expires_at")
      .eq("email", email)
      .single();

    // If there's a fetch error that isn't "No Rows Found"
    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("Error fetching user:", fetchError.message);
      return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 });
    }

    const accessCode = generateAccessCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    let userId: string;

    // Start empty; we only fill it if we actually have a name (sign up or DB).
    let userFirstName = "";

    /**
     * -------------------------------
     * Sign In Flow
     * -------------------------------
     */
    if (signIn) {
      if (!existingUser) {
        // Not found -> "User not found"
        return NextResponse.json(
          {
            success: false,
            error: "User not found. Please sign up first.",
          },
          { status: 404 }
        );
      }

      // We grab the user’s first name from DB (may be empty or null, but never "friend")
      userFirstName = existingUser.first_name || "";
      userId = existingUser.user_id;

      // Update just the code & expiry
      const { error: updateError } = await supabase
        .from("users")
        .update({
          access_code: accessCode,
          access_code_expires_at: expiresAt,
        })
        .eq("user_id", userId);

      if (updateError) {
        console.error("Error updating user:", updateError.message);
        return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
      }
    } else {
      /**
       * -------------------------------
       * Sign Up / Onboard Flow
       * -------------------------------
       */
      if (!existingUser) {
        // New user -> Insert
        const { data: newUser, error: insertError } = await supabase
          .from("users")
          .insert([
            {
              email,
              first_name: firstName,
              access_code: accessCode,
              access_code_expires_at: expiresAt,
            },
          ])
          .select("user_id, first_name")
          .single();

        if (insertError) {
          console.error("Error inserting user:", insertError.message);
          return NextResponse.json({ success: false, error: insertError.message }, { status: 500 });
        }

        userId = newUser.user_id;
        userFirstName = newUser.first_name || "";
      } else {
        // Existing user -> Update
        const { data: updatedUser, error: updateError } = await supabase
          .from("users")
          .update({
            first_name: firstName,
            access_code: accessCode,
            access_code_expires_at: expiresAt,
          })
          .eq("user_id", existingUser.user_id)
          .select("user_id, first_name")
          .single();

        if (updateError) {
          console.error("Error updating user:", updateError.message);
          return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
        }

        userId = updatedUser.user_id;
        userFirstName = updatedUser.first_name || "";
      }
    }

    // Generate the magic link
    const magicLink = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?user_id=${userId}`;
    const isReturningUser = Boolean(existingUser);

    // If userFirstName is empty, we skip the name in the subject
    const subject = isReturningUser
      ? userFirstName
        ? `Welcome back to njiva, ${userFirstName}!`
        : `Welcome back to njiva!`
      : userFirstName
      ? `Welcome to njiva, ${userFirstName}!`
      : `Welcome to njiva!`;

    // Greeting line: if userFirstName is empty, just "Hi," else "Hi John,"
    const greetingLine = userFirstName ? `Hi ${userFirstName},` : "Hi,";

    const bodyLine = isReturningUser
      ? "Good to see you back at njiva, your ADHD-friendly productivity sidekick!"
      : "Welcome to njiva, your ADHD-friendly productivity sidekick!";

    const htmlContent = `
      <p>${greetingLine}</p>
      <p>${bodyLine}</p>
      <p><strong>4-Digit Access Code:</strong><br>Use this code to log in:</p>
      <h2>${accessCode}</h2>
      <p><strong>Magic Link:</strong><br>Prefer clicking? Use this link to jump right in:</p>
      <p><a href="${magicLink}">Access njiva now</a></p>
      <p>stay awesome,<br>the njiva team</p>
      <p><em>P.S. Got questions? We’ve got answers: njiva.app@gmail.com.</em></p>
    `;

    try {
      await sendEmail(email, subject, htmlContent);
      console.log("✅ Email sent successfully to:", email);
    } catch (emailError: any) {
      console.error("❌ Error sending email:", emailError.message);
      return NextResponse.json({ success: false, error: "Failed to send email." }, { status: 500 });
    }

    // Return success and the user's first name so front-end can show "Hey John!"
    return NextResponse.json({
      success: true,
      message: "Check your email for the access code and magic link.",
      firstName: userFirstName,
    });
  } catch (error: any) {
    console.error("Error during onboarding:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

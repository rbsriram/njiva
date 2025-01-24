/**
 * Analyse API Route
 * --------------------------
 * Purpose:
 * - Fetch raw notes from Supabase.
 * - Process and organize them using OpenAI.
 * - Deduplicate items between "NEW INPUT" and "PREVIOUS ITEMS."
 * - Save structured data back to Supabase, including date, time, and recurrence.
 * 
 * Key Functions:
 * - Fetch raw notes from `pending_entries` table.
 * - Send notes to OpenAI for categorization and refinement.
 * - Parse the structured JSON response.
 * - Save categorized data into the `organized_entries` table.
 * - Archive data into `historic_entries` table.
 * 
 * Dependencies:
 * - OpenAI API for text analysis.
 * - Supabase for data storage.
 * - `formatToUTC` for consistent date-time storage.
 * - `PromptBuilder` for generating LLM prompt.
 */

console.log("--------------------/analyse/Route.ts Component Mounted-----------------------");

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import { formatToUTC } from "@/lib/dateTimeUtils"; // ✅ Ensure UTC normalization
import { PromptBuilder } from "@/lib/llmPrompts"; // Ensure this path is correct

// ✅ Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// ✅ Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST API Handler
 * --------------------------
 * Handles organizing unstructured notes into structured data.
 */
export async function POST(request: NextRequest) {
  let userTimezone = "UTC"; // Default timezone

  // 1️⃣ Extract user email (or user identifier) from request header or session (as part of authentication flow)
  const email = request.headers.get("email"); // Or use a session method to retrieve the email

  if (!email) {
    return NextResponse.json({ error: "User not authenticated. Email required." }, { status: 400 });
  }

  // 2️⃣ Fetch the userId from the 'users' table using the provided email
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .single(); // Fetch a single record based on the unique email

  if (userError || !userData) {
    return NextResponse.json({ error: "User not found or authentication failed." }, { status: 404 });
  }

  const userId = userData.id; // Now you have the userId to use in queries for the logged-in user
  console.log("User logged in with userId:", userId);

  try {
    console.log("🛠️ Step 1: Parsing request body...");
    let body;
    try {
      body = await request.json();
      userTimezone = body?.timezone || "UTC"; // Fallback to UTC if timezone is missing
      console.log("✅ User Timezone:", userTimezone);
    } catch (error: any) {
      console.warn("⚠️ Failed to parse JSON body, using default timezone (UTC).", error.message);
    }

    // 2️⃣ Fetch Raw Data from the pending_entries table (staging table)
    console.log("🛠️ Step 2: Fetching pending entries...");
    const { data: pendingData, error: fetchError } = await supabase
      .from("pending_entries")
      .select("id, content");

    if (fetchError) {
      console.error("❌ Failed to fetch pending entries:", fetchError.message);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!pendingData || pendingData.length === 0) {
      console.warn("⚠️ No data available in pending entries.");
      return NextResponse.json(
        { error: "No data available in pending entries." },
        { status: 400 }
      );
    }

    const newInput = pendingData.map((entry) => entry.content).join(" ");
    console.log("✅ New Input:", newInput);

    // 3️⃣ Fetch Previous Items (from organized_entries, excluding completed)
    console.log("🛠️ Step 3: Fetching previous organized data...");
    const { data: previousData, error: previousError } = await supabase
      .from("organized_entries")
      .select("content, completed");

    const previousItems = previousData
      ? previousData
          .filter((entry: any) => !entry.completed) // Exclude completed tasks
          .map((entry: any) => entry.content)
          .join(", ")
      : "";

    if (previousError) {
      console.error("❌ Failed to fetch previous items:", previousError.message);
    }

    console.log("✅ Previous Items:", previousItems);

    // 4️⃣ Generate LLM Prompt using PromptBuilder
    const prompt = PromptBuilder.buildPrompt(newInput, previousItems || "", { timezone: userTimezone, currentDate: new Date().toISOString().split('T')[0] });

    // 5️⃣ Send Data to OpenAI for categorization
    console.log("🛠️ Step 4: Sending data to OpenAI...");
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are a structured note-organizing assistant." },
        { role: "user", content: prompt },
      ],
      max_tokens: 1000,
      temperature: 0.5,
    });

    console.log("✅ OpenAI Response Received");

    // 6️⃣ Parse JSON Response from OpenAI
    const analysis = response.choices?.[0]?.message?.content?.trim() || "";
    let parsedAnalysis;

    try {
      if (analysis.includes("```json")) {
        const jsonMatch = analysis.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch && jsonMatch[1]) {
          parsedAnalysis = JSON.parse(jsonMatch[1]);
        } else {
          throw new Error("No valid JSON block found.");
        }
      } else {
        parsedAnalysis = JSON.parse(analysis);
      }
    } catch (parseError: any) {
      console.error("❌ JSON Parsing Error:", parseError.message);
      console.error("❌ Faulty Response:", analysis);
      return NextResponse.json(
        { error: "Failed to parse OpenAI response into valid JSON." },
        { status: 500 }
      );
    }

    console.log("******************✅ OPENAI API Parsed Analysis:*****************", parsedAnalysis);
    console.log("******************************************************************");

    // 7️⃣ Insert/Update Data in organized_entries
    type OrganizedInsert = {
      user_input_id: string | null;
      type: string;
      content: any;
      recurrence: string | null;
      date: string | null;
      day: string | null;
      time: string | null;
      completed: boolean;
    };

    const organizedInserts: OrganizedInsert[] = [];

    // 🛠️ Fetch Existing Items to Avoid Duplication
    const { data: existingItemsData, error: existingItemsError } = await supabase
      .from("organized_entries")
      .select("content");

    if (existingItemsError) {
      console.error("❌ Failed to fetch existing organized data:", existingItemsError.message);
    }

    const existingItems = new Map<string, any>(
      existingItemsData?.map((entry: any) => [entry.content, entry]) || []
    );

    // 🛠️ Refactored Category Mapping with Deduplication Logic
    const mapCategory = (data: any, type: string, existingItems: Map<string, any>) => {
      if (Array.isArray(data)) {
        data.forEach((item: any) => {
          const content = item.item || item.title || null;

          // ✅ Deduplication Check
          if (existingItems.has(content)) {
            console.warn(`⚠️ Duplicate Detected: Skipping "${content}"`);

            // Get the existing item
            const existingItem = existingItems.get(content);

            // If the existing entry lacks date/time, update it with new context
            if (existingItem && (!existingItem.date || !existingItem.time)) {
              existingItem.date = item.date || existingItem.date;
              existingItem.time = item.time || existingItem.time;
              console.log(`✅ Updated existing entry with new context for "${content}"`);
              return; // Skip adding a new row, as it's just an update
            }
          }

          // ✅ Validate date and time
          const isValidDate = item.date && !isNaN(new Date(item.date).getTime());
          const isValidTime = item.time && /^([01]\d|2[0-3]):([0-5]\d)$/.test(item.time); // Validates time as HH:MM

          // ✅ Add unique content to the map to prevent duplicate inserts
          existingItems.set(content, {
            user_input_id: pendingData[0]?.id || null,
            type,
            content,
            recurrence: item.recurrence || null,
            date: isValidDate ? formatToUTC(new Date(item.date)) : null,
            day: isValidDate
              ? new Date(item.date).toLocaleDateString("en-US", { weekday: "long" })
              : null,
            time: isValidTime ? item.time : null,
            completed: false,
          });

          organizedInserts.push(existingItems.get(content)); // Add the updated entry to the insert list
        });
      }
    };

    // Map categories to handle deduplication and insertion
    mapCategory(parsedAnalysis.Do, "do", existingItems);
    mapCategory(parsedAnalysis.Plan, "plan", existingItems);
    mapCategory(parsedAnalysis.Think, "think", existingItems);
    mapCategory(parsedAnalysis["Shopping List"], "shopping_list", existingItems);
    mapCategory(parsedAnalysis["Important Dates/Events"], "important_dates_events", existingItems);

    // 8️⃣ Save Organized Data in organized_entries
    const { error: insertError } = await supabase
      .from("organized_entries")
      .insert(organizedInserts);

    if (insertError) {
      console.error("❌ Failed to save organized data:", insertError.message);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // 9️⃣ Copy Data to historic_entries for archiving
    const { error: archiveError } = await supabase
      .from("historic_entries")
      .insert(organizedInserts);

    if (archiveError) {
      console.error("❌ Failed to archive organized data:", archiveError.message);
    }

    // Purge the pending_entries table after successful insertion
    const { error: purgeError } = await supabase
      .from("pending_entries")
      .delete()
      .eq("user_id", userId); // Assuming user_id is the identifier for the user

    if (purgeError) {
      console.error("❌ Failed to purge pending entries:", purgeError.message);
      return NextResponse.json({ error: purgeError.message }, { status: 500 });
    }
    // ✅ Return success response
    return NextResponse.json({
      success: true,
      analysis: parsedAnalysis,
      message: "Data organized, saved, and archived successfully.",
    });
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}

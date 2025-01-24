/**
 * LLM Prompt for Organizing User Input with Deduplication and Date/Time Resolution
 * -------------------------------------------------------
 * Purpose:
 * - Organize user notes into specific categories.
 * - Remove duplicate or semantically similar items between NEW INPUT and PREVIOUS ITEMS.
 * - Ensure clarity, structure, and timezone consistency.
 * - Resolve dates and days with specific rules.
 * 
 * Categories:
 * - Do
 * - Plan
 * - Think
 * - Shopping List
 * - Important Dates/Events
 * 
 * Key Features:
 * - Deduplication across new and previous inputs.
 * - Semantic merging of similar items.
 * - Strict JSON output format.
 * - Explicit date, time, and recurrence handling.
 */

/**
 * Types and interfaces for the prompt builder
 */

// Interface for each item in the category (task, plan, event, etc.)
interface CategoryItem {
  item: string;
  recurrence: string | null;
  date: string | null;
  time: string | null;
  completed: boolean;
}

// List of valid categories for the prompt
type Categories = 'Do' | 'Plan' | 'Think' | 'Shopping List' | 'Important Dates/Events';

// Interface to handle date/time configurations
interface DateTimeConfig {
  timezone: string;
  currentDate: string;
}

/**
 * Core prompt sections with maintained documentation
 */
class PromptBuilder {
  // Define the categories and their descriptions
  private static categories: Record<Categories, string> = {
    'Do': 'Actions to complete (tasks, to-dos, reminders) - EXCEPT shopping or purchase related items',
    'Plan': 'Things to research, learn, explore, or prepare',
    'Think': 'Ideas, reflections, concepts, creative thoughts',
    'Shopping List': 'Any items to buy or purchase including consumables (groceries, food) and non-consumables (furniture, electronics)',
    'Important Dates/Events': 'Birthdays, anniversaries, deadlines'
  };

  // Method to generate the categorization section of the prompt
  private static buildCategorizationRules(): string {
    return Object.entries(this.categories)
      .map(([cat, desc]) => `- **${cat}:** ${desc}`)
      .join('\n');
  }

  // Method to generate the refinement section of the prompt
  private static buildRefinementRules(): string {
    return `
- Make tasks clear and actionable
- Preserve context (dates, times, details)
- Do not split tasks unless explicitly stated
- Do not create new/unrelated tasks
- Only categorize and clarify existing input
- Ensure items for shopping cart are not included in Do. Keep all entries logically unique. And do not have duplicate entries which mean the same thing.
- Also ensure that you do not take any of the examples given below in this prompt as the input.


### Categorization Examples:
     Do:
    - "Team meeting next Tuesday 2pm"
    - "Submit report by Friday"
    - "Doctor appointment tomorrow 3pm"
    - "Call mom tonight"
    - "Dinner reservation Saturday"
    - "Pick up kids at 5pm"

    Plan: 
    - "Research summer vacation options"
    - "Plan quarterly budget"
    - "Learn Spanish"
    - "Explore new job opportunities"
    - "Prepare presentation"
    - "Compare insurance plans"

    Think:
    - "Blog post ideas"
    - "Team productivity improvements"
    - "Living room design concepts"
    - "Story plot ideas"
    - "Business opportunities"
    - "Social media themes"

    Shopping List:
    - "Buy milk, eggs and bread"  
    - "Get new laptop"
    - "Purchase office supplies"
    - "Groceries: vegetables, fruits"
    - "Order birthday gift"
    - "Get cleaning supplies"

    Important Dates/Events:
    - "Mom's birthday March 15"
    - "Wedding anniversary June 21"
    - "Tax filing deadline April 15"
    - "School year starts September 1"
    - "Christmas day December 25"
    - "Company fiscal year end"

    ### Key Classification Rules:
    1. If it's actionable with a specific date/time → Do
    2. If it's a significant life event or annual occasion → Important Dates/Events
    3. If it involves buying/purchasing → Shopping List
    4. If it needs research/preparation → Plan
    5. If it's an idea/concept → Think;`;
  }

  // Method to generate the deduplication section of the prompt
  private static buildDeduplicationRules(): string {
    return `
- Compare new vs previous items
- Remove exact duplicates
- Merge semantically similar items
- Prioritize most specific entry`;
  }

  // Method to generate the date/time handling section of the prompt
  private static buildDateTimeRules(config: DateTimeConfig): string {
    return `
    ### Date and Time Processing Rules:

    1. Current Reference Date: ${config.currentDate}
    Use this as the base date for all date calculations.

    2. Date Output Requirements:
    - MUST output actual calculated dates, never placeholders
    - Format: YYYY-MM-DD (e.g., 2025-01-10)
    - All dates must be equal to or after ${config.currentDate}
    - No date should have explicit "YYYY" in it or "MM", they should always resolved to a valid date and not placeholders. The only exception is "null"

    3. Basic Date Terms:
    - "today" → current date (${config.currentDate})
    - "tomorrow" → next calendar day (${config.currentDate} + 1 day)
    - "day after" or "next day" → next calendar day (same as tomorrow)
    - "day after tomorrow" → current date + 2 days

    4. Weekday Calculations:
    a) For "this [weekday]" or "coming [weekday]":
    - If the weekday hasn't occurred yet this week, use this week's date
    - If the weekday has already passed this week, use next week's date
    - Example when current date is Monday (${config.currentDate}):
      * "this/coming Monday" = 2025-01-20 (already passed, so next week)
      * "this/coming Tuesday" = 2025-01-14 (this week)
      * "this/coming Wednesday" = 2025-01-15 (this week)
      * "this/coming Thursday" = 2025-01-16 (this week)
      * "this/coming Friday" = 2025-01-17 (this week)
      * "this/coming Saturday" = 2025-01-18 (this week)
      * "this/coming Sunday" = 2025-01-19 (this week)

    b) For "next [weekday]" or "following [weekday]":
    - Always use the weekday in the following week
    - "Following" means exactly the same as "next"
    - Example when current date is Monday (${config.currentDate}):
      * "next/following Monday" = 2025-01-20
      * "next/following Tuesday" = 2025-01-21
      * "next/following Wednesday" = 2025-01-22
      * "next/following Thursday" = 2025-01-23
      * "next/following Friday" = 2025-01-24
      * "next/following Saturday" = 2025-01-25
      * "next/following Sunday" = 2025-01-26

    5. Other "Next/Following" Terms:
    a) For "next week" or "following week":
    - Add 7 days to the current date
    - If no specific day mentioned, use Monday of next week
    - Example: "next week" or "following week" on ${config.currentDate} = 2025-01-20

    b) For "next month" or "following month":
    - If a date is specified (e.g., "next month 15th"), use that date in the next month
    - If no date specified, use the 1st of next month
    - Example: "next month 15th" from ${config.currentDate} = 2025-02-15

    6. Time Processing Rules:
    - Format: HH:mm (24-hour format)
    - If no time specified, set as null
    - Convert 12-hour format to 24-hour (e.g., "3pm" → "15:00")

    7. Recurrence Rules:
    - daily: occurs every day
    - weekly: occurs every week on the same day
    - monthly: occurs every month on same date
    - yearly: occurs every year on same date
    - null: one-time event

    8. IMPORTANT: Keywords and their meanings:
    - "this/coming" refers to this week's occurrence (or next week if already passed)
    - "next/following" always refers to the following week's occurrence
    - "next" and "following" are exactly equivalent and should be treated the same way'
    - Ensure you DO NOT take the dates mentioned in the example as the current date, the current date will always be ${config.currentDate}`;
  }
 
  /**
   * Main method to build the complete prompt
   * @param newInput - New unstructured user input
   * @param previousItems - Previous categorized items to compare against (optional)
   * @param config - DateTime configuration (timezone, current date)
   * @returns The full prompt string for OpenAI
   */
  static buildPrompt(
    newInput: string,
    previousItems: string = '',
    config: DateTimeConfig = { timezone: 'UTC', currentDate: new Date().toISOString().split('T')[0] }
  ): string {
    console.log("*******************LLM INPUT START******************************");
    console.log("Current Date: ", config.currentDate);
    console.log("📝 NEW INPUT:", newInput);
    console.log("📝 PREVIOUS ITEMS:", previousItems);
    console.log("*******************LLM INPUT END******************************");
    
    const prompt = `
You are organizing user notes into categories.
Process ${newInput} and ${previousItems} only. Use ${config.currentDate} value as the current date for all your date calculations.DO NOT create your own examples or use any of these examples below, unless these have been explicitly put in by the user. 

### Categories:
${this.buildCategorizationRules()}

### Refinement:
${this.buildRefinementRules()}

### Deduplication:
${this.buildDeduplicationRules()}

### DateTime:
${this.buildDateTimeRules(config)}

### Output Format:
\`\`\`json
{
  "Do": [{"item": string, "recurrence": string|null, "date": "YYYY-MM-DD"|null, "time": "HH:mm"|null, "completed": boolean}],
  "Plan": [{"item": string, "recurrence": string|null, "date": "YYYY-MM-DD"|null, "time": "HH:mm"|null, "completed": boolean}],
  "Think": [{"item": string, "recurrence": string|null, "date": "YYYY-MM-DD"|null, "time": "HH:mm"|null, "completed": boolean}],
  "Shopping List": [{"item": string, "recurrence": string|null, "date": "YYYY-MM-DD"|null, "time": "HH:mm"|null, "completed": boolean}],
  "Important Dates/Events": [{"item": string, "recurrence": string|null, "date": "YYYY-MM-DD"|null, "time": "HH:mm"|null, "completed": boolean}]
}
\`\`\`

**NEW INPUT:**
${newInput}

${previousItems ? `**PREVIOUS ITEMS:**\n${previousItems}` : ''}`;

    //console.log("💬 FINAL PROMPT SENT TO LLM:", prompt);
    return prompt;
  }
}    

// Export the PromptBuilder class
export { PromptBuilder };

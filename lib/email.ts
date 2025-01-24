import fetch from 'node-fetch'; // Use node-fetch for making HTTP requests

console.log("--------------------lib/email.ts Mounted-----------------------");

interface EmailErrorResponse {
  message?: string;
}

/**
 * Sends a transactional email using Brevo.
 * 
 * @param toEmail - Recipient's email address.
 * @param subject - Subject of the email.
 * @param htmlContent - HTML content of the email.
 */
export async function sendEmail(toEmail: string, subject: string, htmlContent: string) {
  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.BREVO_API_KEY!, // Use the API key from environment variables
      },
      body: JSON.stringify({
        sender: {
          name: "njiva app",
          email: process.env.BREVO_SENDER_EMAIL!, // Sender email from environment variables
        },
        to: [{ email: toEmail }],
        subject,
        htmlContent,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.json() as EmailErrorResponse;
      console.error("❌ Failed to send email:", errorBody);
      throw new Error(`Email send failed: ${errorBody.message || "Unknown error"}`);
    }

    const responseData = await response.json();
    console.log("✅ Email sent successfully:", JSON.stringify(responseData));
    return responseData;
  } catch (error: any) {
    console.error("❌ Error during email send:", error.message);
    throw new Error("Failed to send email.");
  }
}
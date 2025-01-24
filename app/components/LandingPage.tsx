/*
 * LandingPage.tsx
 * 
 * This component serves as the onboarding page for the Njiva app. 
 * - Allows users to enter their name and email for registration or login.
 * - Sends the user's data to the backend for verification or account creation.
 * - Displays a modal for entering the 4-digit access code sent via email.
 * 
 * Key Features:
 * 1. Input validation for name and email with capitalization for the name.
 * 2. Sends user data to `/api/onboard` and handles backend responses.
 * 3. Displays personalized messages in the modal overlay for a better user experience.
 * 4. Handles the 4-digit access code input and sends it to `/api/verify-code` for validation.
 * 5. Redirects to the user dashboard upon successful login or registration.
 */

"use client";

import React, { useEffect, useState } from "react";
import Logo from "@/components/ui/logo";
import { ArrowRight, X, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";

const LandingPage = () => {
  // ----- Existing States -----
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [isClient, setIsClient] = useState(false);
  const [isValidEmail, setIsValidEmail] = useState(false);
  const [isValidName, setIsValidName] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [accessCode, setAccessCode] = useState(["", "", "", ""]);
  const [modalContent, setModalContent] = useState("");

  // ----- New States for Sign In Flow -----
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [signInEmail, setSignInEmail] = useState("");
  const [signInValidEmail, setSignInValidEmail] = useState(false);
  const [signInError, setSignInError] = useState("");
  const [isSignInSubmitting, setIsSignInSubmitting] = useState(false);
  // Flag to track if we're currently in sign-in mode for the passcode
  const [isSignInFlow, setIsSignInFlow] = useState(false);
  const [signInFirstName, setSignInFirstName] = useState("");

  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
    console.log("LandingPage mounted");
    return () => console.log("LandingPage unmounted");
  }, []);

  // ----- Existing validation -----
  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const validateName = (name: string) => {
    const regex = /^[A-Za-zÀ-ÖØ-öø-ÿ'-\s]+$/;
    return regex.test(name.trim()) && name.trim().length > 1;
  };

  const validateForm = () => {
    return isValidEmail && isValidName;
  };

  const capitalizeName = (name: string) => {
    return name
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // ----- Existing Input Handlers -----
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    setIsValidEmail(validateEmail(newEmail));
  };

  const handleFirstNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setFirstName(capitalizeName(newName));
    setIsValidName(validateName(newName));
  };

  // ----- Existing Submit (Sign Up / Onboard) -----
  const handleSubmit = async (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setIsSubmitting(true);
      try {
        const response = await fetch("/api/onboard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, firstName }),
        });
        const data = await response.json();

        if (data.success) {
          setModalContent(
            `Hi ${firstName}, your 4-digit access code has been sent to ${email}. Check your email to continue.`
          );
          setShowModal(true);
          setIsSignInFlow(false); // This is a sign-up flow
        } else {
          // Minimal UI clutter: just set an error
          setError(data.error || "Something went wrong.");
        }
      } catch (error: any) {
        console.error("Error during onboarding:", error);
        setError(error.message || "Something went wrong. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setError("Please provide a valid name and email.");
    }
  };

  // ----- New: Sign In Flow Handlers -----
  const handleSignInClick = () => {
    // Show sign in modal
    setShowSignInModal(true);
    setSignInError("");
    setSignInEmail("");
    setSignInValidEmail(false);
  };

  const handleSignInEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setSignInEmail(newEmail);
    setSignInValidEmail(validateEmail(newEmail));
    setSignInError("");
  };

  const handleSignInSubmit = async () => {
    if (!signInValidEmail) return;
    setIsSignInSubmitting(true);

    try {
      const response = await fetch("/api/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: signInEmail, signIn: true }),
      });
      const data = await response.json();

      if (data.success) {
        // Fetch user's stored firstName from the table
        setSignInFirstName(data.firstName || "");
        // Close sign-in modal, open passcode modal
        setShowSignInModal(false);
        setError(""); // Clear any old sign-up errors
        setIsSignInFlow(true); // We are in sign-in flow now
        setShowModal(true);
        // Optionally customize the text in the passcode modal
        setModalContent(
          `We’ve sent a 4-digit code to ${signInEmail}. Please check your inbox and enter it below.`
        );
      } else {
        // "User not found" or another error
        setSignInError(data.error || "Something went wrong.");
      }
    } catch (err: any) {
      console.error("Sign-in error:", err);
      setSignInError("Something went wrong. Please try again.");
    } finally {
      setIsSignInSubmitting(false);
    }
  };

  // ----- Passcode (Shared) Handlers -----
  const handlePasscodeInput = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...accessCode];
    newCode[index] = value;
    setAccessCode(newCode);

    if (value && index < 3) {
      const nextInput = document.querySelector(`input[data-index="${index + 1}"]`) as HTMLElement;
      nextInput?.focus();
    }
  };

  const handlePasscodeSubmit = async () => {
    if (accessCode.some((digit) => digit === "")) {
      // "All digits needed" prompt
      setError("All digits needed! 🔢");
      return;
    }

    try {
      // Decide which email to use:
      // If we are in sign-in flow => signInEmail
      // Otherwise => the sign-up email
      const emailToUse = isSignInFlow ? signInEmail : email;

      const response = await fetch("/api/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailToUse, accessCode: accessCode.join("") }),
      });
      const data = await response.json();

      if (data.success) {
        router.push(`/dashboard?user=${data.userId}`);
      } else {
        setError(data.error || "Invalid access code.");
      }
    } catch (error: any) {
      setError(error.message || "Something went wrong. Please try again.");
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setAccessCode(["", "", "", ""]);
    setError("");
  };

  if (!isClient) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white px-4 relative">
      {/* Sign In Button (top-right) */}
      <div className="absolute top-4 right-4">
        <button
          onClick={handleSignInClick}
          className="flex flex-col items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <LogIn className="h-6 w-6" />
          <span className="text-sm">Sign In</span>
        </button>
      </div>

      <div className="max-w-md w-full space-y-12 text-center">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>

        <div className="space-y-3">
          <h1 className="text-4xl font-medium">
            <span className="bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 bg-clip-text text-transparent">
              Transcend distractions
            </span>
          </h1>
          <p className="text-gray-600 text-lg">The ADHD-friendly way to find your flow</p>
        </div>

        {/* Sign Up / Onboard Form */}
        <div>
          <form onSubmit={handleSubmit} className="relative space-y-4">
            <div className="p-[1px] rounded-lg bg-gradient-to-r from-gray-200 via-gray-400 to-gray-200 transition-all duration-300 shadow-sm">
              <div className="flex items-center gap-2 bg-white rounded-lg relative">
                <input
                  type="text"
                  value={firstName}
                  onChange={handleFirstNameChange}
                  placeholder="Enter your first name"
                  className="w-full px-4 py-3 text-lg rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div className="p-[1px] rounded-lg bg-gradient-to-r from-gray-200 via-gray-400 to-gray-200 transition-all duration-300 shadow-sm">
              <div className="flex items-center gap-2 bg-white rounded-lg relative">
                <input
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 text-lg rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                {validateForm() && (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-lg transition-all duration-300 ${
                      isSubmitting
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-black hover:bg-green-600 active:scale-95"
                    }`}
                    onClick={handleSubmit}
                  >
                    {isSubmitting ? (
                      <svg
                        className="h-6 w-6 text-white animate-spin"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v4a4 4 0 000 8H4z"
                        ></path>
                      </svg>
                    ) : (
                      <ArrowRight className="h-6 w-6 text-white" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {error && <p className="text-red-500 text-sm mt-2 text-left">{error}</p>}
          </form>
        </div>
      </div>

      {/* Sign In Modal */}
      {showSignInModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 relative">
            <button
              onClick={() => setShowSignInModal(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>

            <div className="text-center space-y-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 bg-clip-text text-transparent">
                Sign In
              </h2>

              <p className="text-gray-600 text-lg">
                Enter your email to sign in.
              </p>

              <div className="relative">
                <input
                  type="email"
                  value={signInEmail}
                  onChange={handleSignInEmailChange}
                  placeholder="Your email"
                  className="w-full px-4 py-3 text-lg border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />

                {signInValidEmail && (
                  <button
                    disabled={isSignInSubmitting}
                    onClick={handleSignInSubmit}
                    className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-lg transition-all duration-300 ${
                      isSignInSubmitting
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-black hover:bg-green-600 active:scale-95"
                    }`}
                  >
                    {isSignInSubmitting ? (
                      <svg
                        className="h-6 w-6 text-white animate-spin"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v4a4 4 0 000 8H4z"
                        ></path>
                      </svg>
                    ) : (
                      <ArrowRight className="h-6 w-6 text-white" />
                    )}
                  </button>
                )}
              </div>

              {signInError && <p className="text-red-500 text-sm">{signInError}</p>}
            </div>
          </div>
        </div>
      )}

      {/* Existing Passcode Modal (for both sign-up and sign-in) */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 relative">
            <button
              onClick={closeModal}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>

            <div className="text-center space-y-6">
              {/* If you want to differentiate sign-up vs sign-in text, you can add logic here */}
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 bg-clip-text text-transparent">
                {isSignInFlow
                  ? `Hey ${signInFirstName}!`
                  : `Hey ${firstName}!`}
              </h2>

              <p className="text-gray-600 text-lg">
                {modalContent || (
                  isSignInFlow
                    ? `Check your inbox! We've sent you a code. Pop it in below.`
                    : `Check your inbox! We've sent you a code. Pop it in below.`
                )}
              </p>

              <div className="flex justify-center gap-3">
                {accessCode.map((digit, index) => (
                  <input
                    key={index}
                    type="text"
                    maxLength={1}
                    value={digit}
                    data-index={index}
                    onChange={(e) => handlePasscodeInput(index, e.target.value)}
                    className="w-12 h-12 text-center text-2xl border-2 rounded-lg focus:border-green-500 focus:outline-none transition-all"
                  />
                ))}
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <button
                onClick={handlePasscodeSubmit}
                className="w-full bg-gradient-to-r from-gray-900 to-gray-800 text-white py-3 rounded-lg text-lg hover:from-green-600 hover:to-green-500 transition-all"
              >
                Let's go!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;

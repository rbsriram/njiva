"use client";

import React, { useState, useEffect } from "react";
import { CircleArrowRight } from "lucide-react";

type InputSectionProps = {
  userId: string; // Added userId as a required prop
  onCapture: (note: string, userId: string) => void; // Updated to include userId
  onOrganize: () => void;
};

const InputSection: React.FC<InputSectionProps> = ({ userId, onCapture, onOrganize }) => {
  const [note, setNote] = useState("");
  const [currentPlaceholder, setCurrentPlaceholder] = useState("Type anything that comes to mind...");
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isAnimating, setIsAnimating] = useState(true);

  const placeholders = [
    "Finish reading the book by next Wednesday.",
    "Plan the marketing strategy for the product launch next month.",
    "Dentist appointment on Thursday at 3 PM.",
    "Pick up fresh tomatoes, spinach, and cheese from the store.",
    "Attend team meeting this Friday morning.",
  ];

  const [typingIndex, setTypingIndex] = useState(0);

  useEffect(() => {
    let typingInterval: NodeJS.Timeout;
    let placeholderSwitchInterval: NodeJS.Timeout;

    if (!isInputFocused && isAnimating) {
      const typePlaceholder = () => {
        typingInterval = setInterval(() => {
          if (typingIndex < currentPlaceholder.length) {
            setNote((prev) => prev + currentPlaceholder[typingIndex]);
            setTypingIndex((prev) => prev + 1);
          } else {
            clearInterval(typingInterval);
            placeholderSwitchInterval = setTimeout(() => {
              const nextPlaceholder =
                placeholders[Math.floor(Math.random() * placeholders.length)];
              setCurrentPlaceholder(nextPlaceholder);
              setNote("");
              setTypingIndex(0);
            }, 1500);
          }
        }, 100);
      };

      typePlaceholder();
    }

    return () => {
      clearInterval(typingInterval);
      clearTimeout(placeholderSwitchInterval);
    };
  }, [currentPlaceholder, typingIndex, isInputFocused, isAnimating]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNote(e.target.value);
  };

  const handleInputFocus = () => {
    setIsInputFocused(true);
    setIsAnimating(false);
    setNote("");
    setCurrentPlaceholder("");
  };

  const handleInputBlur = () => {
    setIsInputFocused(false);
    if (!note) {
      setCurrentPlaceholder("Type anything that comes to mind...");
      setIsAnimating(true);
    }
  };

  const handleOrganize = async () => {
    await onOrganize();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return;
    await onCapture(note, userId); // Pass userId when capturing the note
    setNote("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-6">
      <div className="w-full max-w-3xl flex flex-col items-center space-y-8">
        {/* Tagline */}
        <div className="text-center w-full">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Think it. Type it. We Organize it.
          </h2>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-lg mx-auto">
            Njiva turns your scattered thoughts into a masterpiece of productivity.
          </p>
        </div>

        {/* Input Box and Submit Button Container */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0">
          <div className="w-full flex">
            <input
              type="text"
              value={note}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              placeholder={currentPlaceholder}
              className="flex-1 p-3 sm:p-4 border rounded-l-md text-base sm:text-lg text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            <button
              type="submit"
              className="bg-black text-white p-3 sm:p-4 rounded-r-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
            >
              <CircleArrowRight className="w-6 h-6 sm:w-7 sm:h-7" />
            </button>
          </div>
        </form>

        {/* Organize Button */}
        <div className="w-full text-center">
          <button
            onClick={handleOrganize}
            className="bg-gray-800 text-white px-6 py-2 sm:px-8 sm:py-3 rounded-full hover:bg-gray-700 transition-all duration-300 text-base sm:text-lg"
          >
            Organize
          </button>
        </div>
      </div>
    </div>
  );
};

export default InputSection;

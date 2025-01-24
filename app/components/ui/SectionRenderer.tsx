// src/components/ui/SectionRenderer.tsx

/**
 * SectionRenderer Component
 * --------------------------
 * Purpose:
 * - Dynamically renders sections (Do, Plan, Think, Shopping List, Important Dates, Upcoming).
 * - Supports collapsible sections, tagging, and actionable subtasks.
 * 
 * Props:
 * - title: Section heading.
 * - icon: Lucide icon associated with the section.
 * - items: Array of items within the section.
 * - type: Type of section (e.g., 'do', 'plan', 'think', 'shopping', 'important_dates', 'upcoming').
 * - onToggleComplete: Callback for toggling task completion (if applicable).
 * 
 * Key Features:
 * - Dynamic rendering based on section type.
 * - Collapsible UI for better organization.
 * - Support for subtasks, tags, and recurring info.
 */
console.log("--------------------SectionRenderer.tsx Component Mounted-----------------------");
import React, { JSX, useState } from "react";
import { ChevronDown, ChevronRight, CheckSquare, Square } from "lucide-react";

type SectionItem = {
  id: string;
  title: string;
  tags?: string[]; // e.g., ["#Urgent", "#Health"]
  dueDate?: string; // For scheduled tasks
  recurring?: string; // e.g., "Monthly", "Yearly"
  subtasks?: { id: string; title: string; completed: boolean }[];
  completed?: boolean;
};

type SectionRendererProps = {
  title: string; // Section name, e.g., "Do", "Plan"
  icon: JSX.Element; // Icon component
  items?: SectionItem[]; // Array of items
  type: "do" | "plan" | "think" | "shopping" | "important_dates" | "upcoming";
  onToggleComplete?: (id: string) => void; // Toggle item completion
};

const SectionRenderer: React.FC<SectionRendererProps> = ({
  title,
  icon,
  items =[], //default to empty array
  type,
  onToggleComplete,
}) => {
  const [isOpen, setIsOpen] = useState(true);

  // Toggle section visibility
  const toggleSection = () => setIsOpen(!isOpen);

  // Toggle subtask completion
  const toggleSubtask = (itemId: string, subtaskId: string) => {
    if (onToggleComplete) {
      onToggleComplete(itemId);
    }
  };

  return (
    <div className="section border border-gray-200 dark:border-gray-700 p-4 rounded-md shadow-md dark:shadow-lg mb-4 bg-white dark:bg-gray-800 transition-colors duration-300">
      {/* Section Header */}
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={toggleSection}
      >
        <h2 className="text-lg flex items-center font-medium text-gray-800 dark:text-gray-100 transition-colors duration-300">
          <span className="mr-2">{icon}</span>
          {title}
        </h2>
        <div className="text-gray-600 dark:text-gray-300 transition-colors duration-300">
          {isOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </div>
      </div>

      {/* Section Content */}
      {isOpen && (
        <div className="mt-2 space-y-2">
          {items.length > 0 ? (
            items.map((item) => (
              <div
                key={item.id}
                className="border rounded-md p-2 bg-gray-50 dark:bg-gray-700"
              >
                {/* Item Title */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3
                      className={`text-md font-medium ${
                        item.completed
                          ? "line-through text-gray-400"
                          : "text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {item.title}
                    </h3>
                    {/* Tags */}
                    {item.tags && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {item.tags.map((tag, index) => (
                          <span key={index} className="mr-1">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                    {/* Due Date */}
                    {item.dueDate && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Due: {item.dueDate}
                      </p>
                    )}
                    {/* Recurring */}
                    {item.recurring && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Recurs: {item.recurring}
                      </p>
                    )}
                  </div>

                  {/* Completion Toggle */}
                  {onToggleComplete && (
                    <button
                      onClick={() => onToggleComplete(item.id)}
                      className="text-gray-600 dark:text-gray-300"
                    >
                      {item.completed ? (
                        <CheckSquare size={18} />
                      ) : (
                        <Square size={18} />
                      )}
                    </button>
                  )}
                </div>

                {/* Subtasks */}
                {item.subtasks && item.subtasks.length > 0 && (
                  <ul className="list-disc pl-5 mt-2 text-sm text-gray-700 dark:text-gray-300">
                    {item.subtasks.map((subtask) => (
                      <li
                        key={subtask.id}
                        className={`flex items-center gap-2 ${
                          subtask.completed
                            ? "line-through text-gray-400"
                            : ""
                        }`}
                      >
                        <button
                          onClick={() => toggleSubtask(item.id, subtask.id)}
                        >
                          {subtask.completed ? (
                            <CheckSquare size={14} />
                          ) : (
                            <Square size={14} />
                          )}
                        </button>
                        {subtask.title}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))
          ) : (
            <p className="text-center text-gray-600 dark:text-gray-300 text-sm">
              No items in this section.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default SectionRenderer;

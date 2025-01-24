"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  PanelLeftOpen,
  PanelLeftClose,
  Brain,
  House,
  Settings,
  MessageSquareDot,
  CircleHelp,
  Bug,
  LogOut,
  CircleUserRound,
} from "lucide-react";

type SidePanelProps = {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
};

const SidePanel: React.FC<SidePanelProps> = ({ isSidebarOpen, setIsSidebarOpen }) => {
  const router = useRouter();
  const pathname = usePathname();

  const handleNavigation = () => {
    if (pathname === "/brain-dump") {
      router.push("/");
    } else {
      router.push("/brain-dump");
    }
  };

  return (
    <div
      className={`h-screen bg-gray-50 dark:bg-gray-900 border-r dark:border-gray-700 flex flex-col ${
        isSidebarOpen ? "w-64" : "w-16"
      } transition-all duration-300`}
    >
      {/* Toggle Button */}
      <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={`${
            isSidebarOpen ? "ml-auto" : ""
          } text-gray-600 dark:text-gray-300`}
        >
          {isSidebarOpen ? (
            <PanelLeftClose size={20} />
          ) : (
            <PanelLeftOpen size={20} />
          )}
        </button>
      </div>

      {/* Sidebar Items */}
      <ul className="flex-1 space-y-4 mt-4">
        {/* Brain Dump or Home */}
        <li
          onClick={handleNavigation}
          className="flex items-center gap-2 cursor-pointer px-4 hover:text-gray-800 dark:hover:text-gray-200"
        >
          {isSidebarOpen ? (
            pathname === "/brain-dump" ? (
              <>
                <House size={20} /> <span>Home</span>
              </>
            ) : (
              <>
                <Brain size={20} /> <span>Brain Dump</span>
              </>
            )
          ) : pathname === "/brain-dump" ? (
            <House size={20} />
          ) : (
            <Brain size={20} />
          )}
        </li>

        {/* Other Sidebar Items */}
        <li className="flex items-center gap-2 cursor-pointer px-4 hover:text-gray-800 dark:hover:text-gray-200">
          <CircleUserRound size={20} /> {isSidebarOpen && <span>Profile</span>}
        </li>
        <li className="flex items-center gap-2 cursor-pointer px-4 hover:text-gray-800 dark:hover:text-gray-200">
          <Settings size={20} /> {isSidebarOpen && <span>Settings</span>}
        </li>
        <li className="flex items-center gap-2 cursor-pointer px-4 hover:text-gray-800 dark:hover:text-gray-200">
          <MessageSquareDot size={20} /> {isSidebarOpen && <span>Feedback</span>}
        </li>
        <li className="flex items-center gap-2 cursor-pointer px-4 hover:text-gray-800 dark:hover:text-gray-200">
          <CircleHelp size={20} /> {isSidebarOpen && <span>Help</span>}
        </li>
        <li className="flex items-center gap-2 cursor-pointer px-4 hover:text-gray-800 dark:hover:text-gray-200">
          <Bug size={20} /> {isSidebarOpen && <span>Report Bug</span>}
        </li>
      </ul>

      {/* Logout */}
      <div className="p-4 border-t dark:border-gray-700">
        <li className="flex items-center gap-2 cursor-pointer hover:text-red-600 dark:hover:text-red-400">
          <LogOut size={20} /> {isSidebarOpen && <span>Logout</span>}
        </li>
      </div>
    </div>
  );
};

export default SidePanel;

"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ListTodo,
  Brain,
  Calendar,
  ShoppingBag,
  Layout,
  ArrowRight,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import Logo from "@/components/ui/logo";
import { supabase } from "@/lib/supabaseClient";

type UserDashboardPageProps = {
  userId: string;
};

type Message = {
  id: string;
  content: string;
  timestamp: Date;
};

type Section = {
  title: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>; // or use LucideProps
  content: string;
};

const SECTIONS: { [key: string]: Section } = {
  do: {
    title: "Do",
    icon: ListTodo,
    content: "Your active tasks and to-do items"
  },
  plan: {
    title: "Plan",
    icon: Layout,
    content: "Upcoming plans and schedules"
  },
  think: {
    title: "Think",
    icon: Brain,
    content: "Thoughts, ideas, and insights"
  },
  dates: {
    title: "Dates",
    icon: Calendar,
    content: "Important dates and events"
  },
  shopping: {
    title: "Shop",
    icon: ShoppingBag,
    content: "Shopping lists and items"
  }
};


const UserDashboardPage: React.FC<UserDashboardPageProps> = ({ userId }) => {
  const router = useRouter();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [activePage, setActivePage] = useState("do");
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editedMessages, setEditedMessages] = useState<Message[]>([]);
  const [firstName, setFirstName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'inherit';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputText]);

  useEffect(() => {
    if (!userId) {
      console.error("No userId provided. Redirecting to the Landing Page.");
      router.push("/");
      return;
    }

    const fetchUserData = async () => {
      try {
        const { data: user, error: userError } = await supabase
          .from("users")
          .select("first_name")
          .eq("user_id", userId)
          .single();

        if (userError) throw userError;
        if (user) setFirstName(user.first_name || "");

        const { data: entries, error: entriesError } = await supabase
          .from("pending_entries")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: true });

        if (entriesError) throw entriesError;
        
        if (entries && entries.length > 0) {
          setHasInteracted(true);
          setMessages(entries.map(entry => ({
            id: entry.id.toString(),
            content: entry.content,
            timestamp: new Date(entry.created_at)
          })));
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    fetchUserData();
  
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".profile-menu")) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
    
  }, [router, userId]);

  

  const handleSubmit = async () => {
    if (!inputText.trim()) return;

    setIsSubmitting(true);
    setHasInteracted(true);

    try {
      const response = await fetch("/api/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: inputText, userId }),
      });

      const result = await response.json();
      if (result.success) {
        const newMessage = {
          id: Date.now().toString(),
          content: inputText,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, newMessage]);
        setInputText("");
      } else {
        console.error("Failed to capture note:", result.error);
      }
    } catch (error) {
      console.error("Error during submission:", error);
    }

    setIsSubmitting(false);
  };

  const startEditing = () => {
    setIsEditing(true);
    setEditedMessages([...messages]);
  };

  const saveEdits = async () => {
    try {
      // TODO: Add API endpoint to handle batch updates
      setMessages(editedMessages);
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving edits:", error);
    }
  };

  const cancelEdits = () => {
    setIsEditing(false);
    setEditedMessages([]);
  };

  const handleMessageEdit = (id: string, newContent: string) => {
    setEditedMessages(prev =>
      prev.map(msg =>
        msg.id === id ? { ...msg, content: newContent } : msg
      )
    );
  };

  const handleLogout = () => {
    localStorage.removeItem("userId");
    router.push("/");
  };

  const handleSectionClick = (sectionKey: string) => {
    setActiveSection(sectionKey);
  };

  const handleDeleteMessage = async (id: string) => {
    try {
      setDeleteError(null); // Clear any previous errors
  
      const response = await fetch("/api/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          id, 
          userId 
        }),
      });
  
      const result = await response.json();
  
      if (result.success) {
        // Remove the message from both editedMessages and messages states
        setEditedMessages(prev => prev.filter(msg => msg.id !== id));
        setMessages(prev => prev.filter(msg => msg.id !== id));
      } else {
        // Set a user-friendly error message
        setDeleteError("Failed to delete the note. Please try again.");
        console.error("Failed to delete message:", result.error);
      }
    } catch (error) {
      // Handle network errors or unexpected issues
      setDeleteError("Unable to delete the note. Check your connection and try again.");
      console.error("Error deleting message:", error);
    }
  };

  const pages = {
    do: { title: "Do", icon: ListTodo },
    plan: { title: "Plan", icon: Layout },
    think: { title: "Think", icon: Brain },
    dates: { title: "Dates", icon: Calendar },
    shopping: { title: "Shop", icon: ShoppingBag },
  };

  const ProfileMenu = () => (
    <div
      className="
        absolute 
        z-50 
        bg-white 
        border 
        border-gray-200 
        rounded-lg 
        shadow-lg 
        py-1 
        w-48
        top-[calc(100%+8px)] 
        left-0 
        md:left-auto 
        md:right-0
      "
    >
      <button className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100">
        Profile
      </button>
      <button
        onClick={handleLogout}
        className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100"
      >
        <span>Logout</span>
      </button>
    </div>
  );

  const NavItems = ({ className = "", vertical = false }) => (
    <>
      {Object.entries(pages).map(([key, { title, icon: Icon }]) => (
        <button
          key={key}
          onClick={() => setActivePage(key)}
          className={`${className} ${
            vertical
              ? "flex items-center w-full p-3 hover:bg-gray-100"
              : "flex flex-col items-center justify-center w-full h-full"
          } ${activePage === key ? "text-blue-500" : "text-gray-500"}`}
        >
          <Icon className="h-6 w-6" />
          <span className={`${vertical ? "ml-3" : "text-xs mt-1"}`}>{title}</span>
        </button>
      ))}
    </>
  );

  return (
    <div className="flex min-h-screen bg-white">
      {/* Desktop Sidebar */}
      <nav className="hidden md:flex flex-col w-64 border-r border-gray-200 pt-4">
        {/* <NavItems vertical={true} /> */}
          <div className="py-4">
          {Object.entries(SECTIONS).map(([key, { title, icon: Icon }]) => (
            <button
              key={key}
              onClick={() => handleSectionClick(key)}
              className={`
                flex 
                items-center 
                w-full 
                px-4 
                py-3 
                hover:bg-gray-100 
                transition-colors
                ${activeSection === key 
                  ? 'bg-blue-50 text-blue-600' 
                  : 'text-gray-700 hover:bg-gray-100'
                }
              `}
            >
              <Icon className="h-6 w-6 mr-3" />
              <span className="font-medium">{title}</span>
            </button>
          ))}
        </div>
      </nav>
      <div className="flex-1 flex flex-col relative">
        <div className="absolute top-4 left-4 md:left-auto md:right-4 profile-menu">
          {firstName && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowProfileMenu(!showProfileMenu);
              }}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600 font-medium"
            >
              {firstName}
            </button>
          )}
          {showProfileMenu && <ProfileMenu />}
        </div>
  
        <div className={`flex-1 flex flex-col transition-all duration-500 ${
          hasInteracted ? 'pt-4' : 'pt-16'
        }`}>
          {/* Logo Section */}
          <div className={`flex justify-center transition-all duration-500 ${
            hasInteracted ? 'mb-4 scale-75' : 'mb-8'
          }`}>
            <Logo />
          </div>
  
          {/* Header Section - fades out after interaction */}
          {!hasInteracted && (
            <header className="text-center px-4 pb-12">
              <h1 className="text-3xl font-bold mb-2 text-gray-900">
                Think it. Type it. We Organize it.
              </h1>
              <p className="text-lg text-gray-600">
                njiva turns your scattered thoughts into a masterpiece of productivity.
              </p>
            </header>
          )}
  
          {/* Messages Section */}
          {hasInteracted && (
            <div className="flex-1 overflow-auto px-4 mb-6">
              <div className="max-w-2xl mx-auto">
                {!isEditing && messages.length > 0 && (
                  <div className="flex justify-end mb-6">
                    <button
                      onClick={startEditing}
                      className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                    >
                      <Pencil className="h-5 w-5 text-gray-600" />
                    </button>
                  </div>
                )}
  
                {isEditing && (
                  <div className="flex justify-end items-center mb-6 gap-3">
                    <button
                      onClick={cancelEdits}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveEdits}
                      className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      Save
                    </button>
                  </div>
                )}
  
                {deleteError && (
                  <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <span className="block sm:inline">{deleteError}</span>
                    <button 
                      onClick={() => setDeleteError(null)}
                      className="absolute top-0 bottom-0 right-0 px-4 py-3 hover:bg-red-200 transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                )}
  
                <div className="space-y-6">
                  {(isEditing ? editedMessages : messages).map((message) => (
                    <div key={message.id} className="group relative">
                      {isEditing ? (
                        <div className="relative">
                          <textarea
                            value={message.content}
                            onChange={(e) => {
                              handleMessageEdit(message.id, e.target.value);
                              e.target.style.height = 'inherit';
                              e.target.style.height = `${e.target.scrollHeight}px`;
                            }}
                            className="w-full p-3 pr-10 border rounded-lg text-lg min-h-[56px] resize-none focus:ring-1 focus:ring-gray-200"
                            style={{ height: 'auto', overflow: 'hidden' }}
                          />
                          <button
                            onClick={() => handleDeleteMessage(message.id)}
                            className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div>
                          <pre className="font-sans whitespace-pre-wrap text-gray-800 text-lg">
                            {message.content}
                          </pre>
                          <div className="mt-2">
                            <span className="text-sm text-gray-400">
                              {new Date(message.timestamp).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </div>
            </div>
          )}
  
          {/* Input Section */}
          <div className="px-4 mb-3">
            <div className="relative max-w-2xl mx-auto w-full">
              <textarea
                ref={textareaRef}
                disabled={isEditing}
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  e.target.style.height = 'inherit';
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                placeholder={isEditing ? "Finish editing to add new thoughts..." : "Type your thoughts... (Shift+Enter for new line)"}
                className="w-full p-4 pr-12 border rounded-lg text-lg min-h-[56px] resize-none focus:outline-none disabled:bg-gray-50 disabled:text-gray-500"
              />
              {!isEditing && inputText.trim() && (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-black rounded-lg hover:bg-gray-800"
                >
                  <ArrowRight className="h-6 w-6 text-white" />
                </button>
              )}
            </div>
          </div>
  
          {/* Organize Button */}
          {messages.length > 0 && !isEditing && (
            <div className="flex justify-center px-4 mb-24 md:mb-32">
              <button
                className="bg-gray-900 text-white px-8 py-3 rounded-full text-lg font-medium hover:bg-gray-800"
                onClick={() => {
                  console.log("Organize clicked");
                }}
              >
                Organize
              </button>
            </div>
          )}
        </div>

        {/* Section Overlay or Panel */}
        {activeSection && (
        <div
          className="
            fixed 
            inset-0 
            bg-white 
            z-50 
            overflow-auto
          "
        >
          <div className="max-w-4xl mx-auto py-8 px-4">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <Logo />
            </div>
            {/* Close Button */}
            <button
              onClick={() => setActiveSection(null)}
              className="
                absolute
                top-4
                right-4
                p-2
                rounded-full
                hover:bg-gray-100
                transition-colors
              "
            >
              <X className="h-6 w-6 text-gray-600" />
            </button>

            {/* Section Title and Content */}
            <div className="flex items-center mb-6">
              {React.createElement(SECTIONS[activeSection].icon, {
                className: "h-6 w-6 mr-2 text-grey-500",
              })}
              <h2 className="text-2xl font-bold text-gray-900">
                {SECTIONS[activeSection].title}
              </h2>
            </div>

            <p className="text-gray-600 text-lg">
              {SECTIONS[activeSection].content}
            </p>

            {/* Additional content for each section can go here */}
          </div>
        </div>
      )}
  
        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
          <div className="flex justify-around items-center h-16">
            {/* <NavItems /> */}
            {Object.entries(SECTIONS).map(([key, { title, icon: Icon }]) => (
            <button
              key={key}
              onClick={() => handleSectionClick(key)}
              className={`
                flex 
                flex-col 
                items-center 
                justify-center 
                w-full 
                h-full
                ${activeSection === key 
                  ? 'text-grey-500' 
                  : 'text-gray-500'
                }
              `}
            >
              <Icon className="h-6 w-6" />
              <span className="text-xs mt-1">{title}</span>
            </button>
          ))}
          </div>
        </nav>
      </div>
    </div>
  );
}

export default UserDashboardPage;
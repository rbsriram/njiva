console.log("--------------------layout.tsx Component Mounted-----------------------");
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// import DarkModeToggle from "@/components/DarkModeToggle";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Njiva App",
  description: "Your Brain, Supercharged!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Check if user is logged in
  const userId = typeof window !== 'undefined' ? localStorage.getItem("userId") : null;
  console.log("Retrieved userId:", userId || "No userId found");


  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div className="flex h-screen font-sans text-black dark:text-white overflow-hidden">
          {/* Dark Mode Toggle */}
          {/* <div className="absolute top-4 right-4 z-10">
            <DarkModeToggle />
          </div> */}
          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-y-auto bg-white dark:bg-gray-900 relative">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}

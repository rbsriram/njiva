"use client";

const Logo = () => (
  <div className="flex items-center justify-center space-x-3">
    {/* Logo mark - circular design representing transcendence */}
    <div className="relative w-16 h-16">
      <div className="absolute inset-0 bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-700 dark:to-gray-500 rounded-full opacity-20 animate-pulse duration-[4000ms]" />
      <div className="absolute inset-4 bg-gradient-to-r from-gray-900 to-gray-800 dark:from-gray-600 dark:to-gray-400 rounded-full" />
      {/* <div className="absolute inset-[0.4rem] border-4 border-current dark:border-white border-black rounded-full" /> */}
    </div>
    {/* Wordmark */}
    <span className="text-4xl font-medium tracking-wide text-gray-900 dark:text-white">njiva</span>
  </div>
);

export default Logo;

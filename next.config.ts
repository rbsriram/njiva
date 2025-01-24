
console.log("--------------------/app/next.config.ts Component Mounted-----------------------");
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Remove redirect logic if you don't want to enforce automatic redirection to /landing
};

export default nextConfig;

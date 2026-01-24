import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  
  // Image optimization for course thumbnails, avatars, etc.
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co', // For Supabase storage images
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // For Google OAuth avatars
      },
    ],
  },

  // Recommended for production
  reactStrictMode: true,
  
  // Performance optimization
  compress: true,
};

export default nextConfig;
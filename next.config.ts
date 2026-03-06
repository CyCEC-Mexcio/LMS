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
      hostname: '**.supabase.co',
    },
    {
      protocol: 'https',
      hostname: 'lh3.googleusercontent.com',
    },
    {
      protocol: 'https',
      hostname: 'images.unsplash.com',
    },
    {
      protocol: 'https',
      hostname: 'plus.unsplash.com',
    },
    {
      protocol: 'https',
      hostname: 'i.imgur.com',
    },
    {
      protocol: 'https',
      hostname: 'res.cloudinary.com',
    },
  ],
  },

  // Recommended for production
  reactStrictMode: true,
  
  // Performance optimization
  compress: true,
};

export default nextConfig;
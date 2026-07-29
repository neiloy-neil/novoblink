/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Supabase Storage (any project)
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      // Unsplash (used in homepage featured banner)
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      // Generic https fallback for user-supplied image URLs
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;

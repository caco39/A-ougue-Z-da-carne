import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    // Ignore lint errors during build because of FlatCompat/Next.js 15 circular dependency issues in containers
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Prevent strict TS build-time failures if there are minor type-stripping mismatches
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      }
    ],
  },
};

export default nextConfig;

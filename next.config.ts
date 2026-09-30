// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // These are your own custom keys (Next.js will ignore them, but you can read them in your app if needed)
  allowedDevOrigins: ["192.168.29.185"], // For local mobile test
  domains: ["192.168.29.185", "127.0.0.1", "localhost"], // For local + PC

  // This is the official Next.js image config
  images: {
    dangerouslyAllowLocalIP: true,
    remotePatterns: [
      {
        protocol: "http",
        hostname: "192.168.29.185", // LAN IP for mobile
        port: "8000",
        pathname: "/media/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1", // PC localhost
        port: "8000",
        pathname: "/media/**",
      },
      {
        protocol: "http",
        hostname: "localhost", // PC localhost
        port: "8000",
        pathname: "/media/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "cdn-icons-png.flaticon.com",
      },
    ],
  },
};

export default nextConfig;

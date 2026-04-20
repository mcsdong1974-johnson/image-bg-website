import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [],
  },
  // Cloudflare Pages 兼容性
  serverExternalPackages: [],
};

export default nextConfig;

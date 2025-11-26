import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  // Disable turbopack - use webpack for Prisma compatibility
  experimental: {
    turbo: undefined,
  },
};

export default nextConfig;

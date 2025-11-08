import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    scrollRestoration: false,
  },
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
  generateBuildId: async () => {
    return `build-${Date.now()}`
  },
  assetPrefix: process.env.NODE_ENV === 'production' ? undefined : undefined,
  env: {
    BUILD_TIME: Date.now().toString(),
  },

};

export default nextConfig;

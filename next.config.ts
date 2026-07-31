import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Phosphor exports a few thousand modules and is not optimized by default;
    // without this every icon import pulls the whole set in dev.
    optimizePackageImports: ["@phosphor-icons/react"],
  },
};

export default nextConfig;

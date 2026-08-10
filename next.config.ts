import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Phosphor exports a few thousand modules and is not optimized by default;
    // without this every icon import pulls the whole set in dev.
    // `/ssr` is a separate entry point and is not covered by the bare one.
    optimizePackageImports: ["@phosphor-icons/react", "@phosphor-icons/react/ssr"],
  },
};

export default nextConfig;

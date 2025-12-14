import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent Turbopack from inferring an incorrect workspace root when multiple
  // lockfiles exist elsewhere on the machine (can lead to slow/hung dev server).
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;

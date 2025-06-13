import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    // React-PDF depends on "canvas", which is a Node.js-specific package. Disabling it
    // prevents Next.js (especially during the server build) from trying to bundle it.
    if (!config.resolve.alias) {
      config.resolve.alias = {};
    }
    // Disable canvas module resolution as it's not needed in browser context
    (config.resolve.alias as Record<string, false>)["canvas"] = false;

    return config;
  },
};

export default nextConfig;

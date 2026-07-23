import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Подстраховка: data/* доступны в serverless traces (v1 catalog / studio).
  outputFileTracingIncludes: {
    "/*": [
      "./data/levels/**/*",
      "./data/movies/**/*",
      "./data/challenges/**/*",
      "./data/campaigns/**/*",
    ],
  },
};

export default nextConfig;

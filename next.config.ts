import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  outputFileTracingIncludes: {
    "/*": ["./datasets/smarthome-dataset/patients/*.json"],
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  outputFileTracingIncludes: {
    "/*": ["./datasets/smarthome-dataset/patients/*.json", "./datasets/smarthome-dataset/trackers/*.json", "./datasets/smarthome-dataset/ground_truth/*.json", "./datasets/demo-fixtures/patients/*.json", "./datasets/demo-fixtures/trackers/*.json"],
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep tracing/turbopack roots pinned to this project directory.
  // This avoids Next.js auto-selecting a parent lockfile outside the repo.
  outputFileTracingRoot: __dirname,
  turbopack: {
    root: __dirname,
  },
  experimental: {
    workerThreads: true,
    webpackBuildWorker: false,
  },
};

export default nextConfig;

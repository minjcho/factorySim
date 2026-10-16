import path from "path";
import { fileURLToPath } from "url";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = (phase) => ({
  reactStrictMode: true,
  outputFileTracingRoot: __dirname,
  // Keep production builds from overwriting a running development server's assets.
  distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next",
});

export default nextConfig;

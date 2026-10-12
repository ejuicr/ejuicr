import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Container builds use the minimal server; Vercel/local `next start` stay unchanged.
  output: process.env.NEXT_OUTPUT_STANDALONE === "1" ? "standalone" : undefined,
  reactStrictMode: true,
  // Keep native/server-only dependencies out of the bundler so they are
  // required at runtime the way their Node.js builds expect.
  serverExternalPackages: ["mongoose", "bcryptjs", "nodemailer"],
};

export default nextConfig;

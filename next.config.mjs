/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_DEMO_MODE: process.env.DEMO_MODE === "true" ? "true" : "false",
  },
};

export default nextConfig;

/** @type {import('next').NextConfig} */
// Standalone Next.js deployment configuration

// BACKEND_URL  — server-side env var set in Coolify / Docker.
//   In prod, point this at the backend service URL (e.g. http://veklom-api:8088)
//   or the public domain if they share a domain (https://veklom.com).
//   Falls back to https://veklom.com for production deployments.
const BACKEND_URL = process.env.BACKEND_URL || "https://veklom.com";

const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  basePath: "/control-plane-next",
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  images: { unoptimized: true },
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || "https://veklom.com",
    NEXT_PUBLIC_BASE_PATH: "/control-plane-next",
  },
  async rewrites() {
    return [
      {
        // All /api/* calls from the browser are proxied to the backend.
        // This avoids CORS entirely — the browser always talks to its own origin.
        source: "/api/:path*",
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },
};
export default nextConfig;

/** @type {import('next').NextConfig} */
// Standalone Next.js deployment configuration

// BACKEND_URL  — server-side env var set in Coolify / Docker.
//   In prod, point this at the backend service URL (e.g. http://veklom-api:8088)
//   or the public domain if they share a domain (https://api.veklom.com).
//   Falls back to https://api.veklom.com for production deployments.
const BACKEND_URL = process.env.BACKEND_URL || "https://api.veklom.com";

const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: true },
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  images: { unoptimized: true },
  // IMPORTANT: Do NOT set NEXT_PUBLIC_API_BASE_URL here.
  // It must remain empty so the browser uses same-origin /api/* paths.
  // The rewrites() block below proxies those to BACKEND_URL server-side.
  // Setting it to https://api.veklom.com causes CORS errors on authenticated requests.
  async rewrites() {
    return [
      {
        // Serve unauthenticated health status from the backend VPS via local proxy
        source: "/health/",
        destination: `${BACKEND_URL}/health/`,
      },
      {
        // Serve unauthenticated API status page from the backend VPS via local proxy
        source: "/status/",
        destination: `${BACKEND_URL}/status/`,
      },
      {
        // PGL ledger calls go to the dedicated ledger service
        source: "/api/v1/ledger/:path*",
        destination: "https://pgl.veklom.com/api/v1/ledger/:path*",
      },
      {
        // Quantum Terminal static assets + WS — proxied to the backend terminal endpoint
        source: "/terminal/:path*",
        destination: `${BACKEND_URL}/terminal/:path*`,
      },
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

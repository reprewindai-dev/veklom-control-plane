/** @type {import('next').NextConfig} */
// Static export so the control plane can be mounted on the backend at
// https://veklom.com/control-plane-next/ (same-origin => no CORS).
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "/control-plane-next";
const IS_DEV = process.env.NODE_ENV === "development";

const nextConfig = {
  reactStrictMode: true,
  ...(IS_DEV ? {} : { output: "export" }),
  basePath: BASE_PATH,
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  images: { unoptimized: true },
  env: {
    // Empty = call the SAME origin the app is served from (no cross-origin CORS).
    // Served at https://veklom.com/control-plane-next/, so API calls hit
    // https://veklom.com/api/v1/... which routes to the same backend.
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "",
    NEXT_PUBLIC_BASE_PATH: BASE_PATH,
  },
  ...(IS_DEV
    ? {
        async rewrites() {
          return {
            beforeFiles: [
              {
                source: "/api/:path*",
                basePath: false,
                destination: "https://api.veklom.com/api/:path*",
              },
            ],
          };
        },
      }
    : {}),
};
export default nextConfig;

/** @type {import('next').NextConfig} */
// Standalone Next.js deployment configuration

const nextConfig = {
  reactStrictMode: true,
  // Removed output: "export" and basePath to allow native Next.js hosting
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  images: { unoptimized: true },
  env: {
    // When running standalone on Coolify, point to the absolute API URL
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.veklom.com",
    NEXT_PUBLIC_BASE_PATH: "",
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://api.veklom.com/api/:path*", // Proxy API calls to bypass CORS issues on the client
      },
    ];
  },
};
export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    // Allow production builds even if there are type errors
    ignoreBuildErrors: true,
  },
  images: {
    // Disable Next Image Optimization when deploying to static hosts
    unoptimized: true,
  },
  experimental: {
    // Server Actions config
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  async rewrites() {
    return [
      // { source: '/api/:path*', destination: '/api/:path*' },
    ];
  },
  async redirects() {
    return [
      // { source: '/old-path', destination: '/new-path', permanent: true },
    ];
  },
};

module.exports = nextConfig;

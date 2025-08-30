import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  serverExternalPackages: ['mysql2'],
  // Optimize for production
  output: 'standalone',
  poweredByHeader: false,
  compress: true,
};

export default nextConfig;

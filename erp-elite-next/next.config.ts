import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // // Fix hot reload on Windows
  // webpack: (config, { dev }) => {
  //   if (dev) {
  //     config.watchOptions = {
  //       poll: 1000,
  //       aggregateTimeout: 300,
  //     };
  //   }
  //   return config;
  // },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  output: 'standalone', // Required for Docker deployment
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  async rewrites() {
    return [
      {
        source: '/storage/:path*',
        destination: '/uploads/:path*',
      },
    ];
  },
  serverExternalPackages: ['pg'],
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    qualities: [75, 85, 90, 100],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        pathname: '/fram3-prod-ext/**',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        pathname: '/fram3-prod/**',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        pathname: '/fram3-ext/**',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        pathname: '/fram3/**',
      },
    ],
  },
  /* config options here */
  experimental: {
    // Turbopack configuration
    turbo: {
      resolveAlias: {
        // Fix Firebase module resolution issues with Turbopack
        '@firebase/auth': '@firebase/auth',
      },
      rules: {
        // Optimize Firebase packages
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  // Webpack fallback for Firebase (when not using Turbopack)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Fix for Firebase in browser
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

export default nextConfig;
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
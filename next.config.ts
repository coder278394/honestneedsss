import type { NextConfig } from "next";

// Enable verbose logging for debugging
if (process.env.NODE_ENV === 'production') {
  console.log('🔍 [BUILD] Starting Next.js build in production mode');
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  productionBrowserSourceMaps: false,
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  
  // ✅ Image optimization configuration
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
      },
      {
        protocol: 'https',
        hostname: 'honestneeds-backend.onrender.com',
      },
      {
        protocol: 'https',
        hostname: 'api.honestneed.com',
      },
      {
        protocol: 'https',
        hostname: '**.honestneed.com',
      },
    ],
  },
  
  // ✅ API Proxy
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/api/:path*',
          destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/:path*`,
        },
      ],
    };
  },

  // ✅ Spec-friendly aliases → canonical routes used across the app.
  //    The floating mobile nav links to the canonical routes directly (no hop);
  //    these keep the spec URLs (/explore, /campaigns/create) resolving too.
  async redirects() {
    return [
      { source: '/explore', destination: '/discover', permanent: false },
      { source: '/campaigns/create', destination: '/campaigns/new', permanent: false },

      // Battle Buddies for Vets moved to a separate site. Everything under
      // /veterans and /battle-buddies now 308-redirects there so old bookmarks,
      // shared links, and in-app references all land in one place.
      // Platform-level veteran recognition (campaign flagging, Sponsorship Pool
      // ordering, veteran_profile on User) stays on honestneed.com.
      {
        source: '/veterans',
        destination: 'https://battlebuddiesforvets.vercel.app/Veterans',
        permanent: true,
        basePath: false,
      },
      {
        source: '/veterans/:path*',
        destination: 'https://battlebuddiesforvets.vercel.app/Veterans',
        permanent: true,
        basePath: false,
      },
      {
        source: '/battle-buddies',
        destination: 'https://battlebuddiesforvets.vercel.app/Veterans',
        permanent: true,
        basePath: false,
      },
      {
        source: '/battle-buddies/:path*',
        destination: 'https://battlebuddiesforvets.vercel.app/Veterans',
        permanent: true,
        basePath: false,
      },
    ];
  },
  
  // ✅ TypeScript
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // ✅ Styled Components
  compiler: {
    styledComponents: {
      displayName: process.env.NODE_ENV !== 'production',
      ssr: true,
      minify: process.env.NODE_ENV === 'production',
    },
  },
};

export default nextConfig;

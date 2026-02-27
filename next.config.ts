import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: "./",
  },
  serverExternalPackages: ["pdf-parse", "mammoth", "word-extractor"],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ldxuqxvvsspgmoogubit.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    domains: ['localhost'],
  },
};

export default nextConfig;

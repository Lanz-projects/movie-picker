import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "172.21.48.1",
    "192.168.0.52",
    "localhost:3000",
    "127.0.0.1:3000",
    "172.21.48.1:3000",
    "192.168.0.52:3000",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.tmdb.org",
        pathname: "/t/p/**",
      },
    ],
  },
};

export default nextConfig;

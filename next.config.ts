import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(process.cwd()),
  },
  allowedDevOrigins: ["*.trycloudflare.com", "*.loca.lt"],
  serverExternalPackages: ["sharp"],
  experimental: {
    proxyClientMaxBodySize: "30mb",
  },
  async redirects() {
    return [{ source: "/dili", destination: "/", permanent: false }];
  },
};

export default nextConfig;

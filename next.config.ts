import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(process.cwd()),
  },
  allowedDevOrigins: ["*.trycloudflare.com", "*.loca.lt"],
  serverExternalPackages: ["sharp"],
  outputFileTracingIncludes: {
    "/api/dili/predict": [
      "./node_modules/sharp/**/*",
      "./node_modules/@img/sharp-linux-x64/**/*",
      "./node_modules/@img/sharp-libvips-linux-x64/**/*",
    ],
  },
  experimental: {
    proxyClientMaxBodySize: "30mb",
  },
  async redirects() {
    return [{ source: "/dili", destination: "/", permanent: false }];
  },
};

export default nextConfig;

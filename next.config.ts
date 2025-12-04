import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  reactCompiler: true,
  experimental: {
    useWasmBinary: true,
  },
  trailingSlash: false,
  skipTrailingSlashRedirect: true,
  compiler: isProd
    ? {
      removeConsole: {
        exclude: ["error"],
      },
    }
    : undefined,
};

export default nextConfig;

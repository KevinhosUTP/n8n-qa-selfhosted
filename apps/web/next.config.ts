import type { NextConfig } from "next";
import { readPublicConfig, readRuntime } from "./src/lib/config/validation";

// Fail before compilation; never serialize process.env through nextConfig.env.
readPublicConfig(process.env);
readRuntime(process.env);

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        { key: "X-Robots-Tag", value: "noindex, nofollow" },
      ],
    }];
  },
};

export default nextConfig;

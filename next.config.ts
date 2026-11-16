import type { NextConfig } from "next";

// WordPress media (wp-content/uploads) is served through next/image.
const wordpressUrl = new URL(process.env.WORDPRESS_URL ?? "http://wealthhub.local");

// Local dev hosts (e.g. *.local from LocalWP) resolve to a private IP, which
// next/image refuses to fetch by default. Allow it only for local hosts so a
// real production domain keeps the default SSRF protection.
const isLocalWordPress =
  wordpressUrl.hostname === "localhost" ||
  wordpressUrl.hostname.endsWith(".local") ||
  wordpressUrl.hostname.endsWith(".test") ||
  /^127\./.test(wordpressUrl.hostname);

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: wordpressUrl.protocol === "https:" ? "https" : "http",
        hostname: wordpressUrl.hostname,
        port: wordpressUrl.port,
        pathname: "/wp-content/uploads/**",
      },
    ],
    dangerouslyAllowLocalIP: isLocalWordPress,
  },
};

export default nextConfig;

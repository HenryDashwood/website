import createMDX from "@next/mdx";
import { createRequire } from "module";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure `pageExtensions`` to include MDX files
  pageExtensions: ["js", "jsx", "mdx", "ts", "tsx"],
  // Optionally, add any other Next.js config below
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        port: "",
        pathname: "/henrydashwood/**",
      },
    ],
    // Allow local images from the public directory
    domains: [],
    unoptimized: false,
  },
  // Exclude content files edited via /editor from triggering Fast Refresh
  // This prevents the editor from hard-refreshing on save.
  webpack: (config, { dev }) => {
    if (dev) {
      const existingIgnored = config.watchOptions?.ignored;
      const customIgnored = ["**/src/app/posts/**/post.mdx", "**/src/app/research/**/content.mdx"];
      const stringIgnored =
        typeof existingIgnored === "string"
          ? [existingIgnored]
          : Array.isArray(existingIgnored)
            ? existingIgnored.filter((item) => typeof item === "string" && item.length > 0)
            : [];

      config.watchOptions = {
        ...config.watchOptions,
        ignored: [...stringIgnored, ...customIgnored],
      };
    }
    return config;
  },
};

const withMDX = createMDX({
  // Add markdown plugins here, as strings for Turbopack compatibility
  options: {
    remarkPlugins: ["remark-gfm", "remark-math"],
    rehypePlugins: ["rehype-katex", "rehype-highlight"],
  },
});

// Wrap MDX and Next.js config with each other
export default withMDX(nextConfig);

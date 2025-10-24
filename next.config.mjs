import createMDX from "@next/mdx";

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

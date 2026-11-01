import createMDX from "@next/mdx";
const rehypePrettyCodeOptions = {
  theme: "slack-ochin",
  defaultLang: {
    block: "plaintext",
    inline: "plaintext",
  },
  keepBackground: false,
};

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure `pageExtensions`` to include MDX files
  pageExtensions: ["js", "jsx", "mdx", "ts", "tsx"],
  // Optionally, add any other Next.js config below
  // Calculus posts moved to Research notes
  async redirects() {
    return ["chain-rule", "product-rule", "quotient-rule", "partial-derivatives"].map((slug) => ({
      source: `/posts/${slug}`,
      destination: `/research/data-science/maths/calculus/${slug}`,
      permanent: true,
    }));
  },
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
    rehypePlugins: ["rehype-slug", "rehype-katex", ["rehype-pretty-code", rehypePrettyCodeOptions]],
  },
});

// Wrap MDX and Next.js config with each other
export default withMDX(nextConfig);

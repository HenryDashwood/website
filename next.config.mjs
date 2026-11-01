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
  // Turbopack's persistent build cache keys MDX output on the file, not on the remark/rehype plugin
  // versions, so a KaTeX upgrade kept serving stale maths HTML from Vercel's restored .next/cache.
  experimental: { turbopackFileSystemCacheForBuild: false },
  // Configure `pageExtensions`` to include MDX files
  pageExtensions: ["js", "jsx", "mdx", "ts", "tsx"],
  // Optionally, add any other Next.js config below
  async redirects() {
    // Research notes that moved when the folders were reorganised (2026-11-01), plus the calculus
    // posts that became research notes.
    const moved = [
      ["/research/AI/papers/big-bird", "/research/AI/long-context/big-bird"],
      ["/research/AI/papers/linformer", "/research/AI/long-context/linformer"],
      ["/research/AI/papers/longformer", "/research/AI/long-context/longformer"],
      ["/research/AI/papers/performer", "/research/AI/long-context/performer"],
      ["/research/AI/papers/reformer", "/research/AI/long-context/reformer"],
      ["/research/AI/pytorch", "/research/tools/pytorch"],
      ["/research/AI/questions/architecture-vs-computing-power", "/research/AI/architecture-vs-computing-power"],
      ["/research/AI/questions/cuda-kernels", "/research/AI/cuda-kernels"],
      ["/research/AI/questions/longer-contexts", "/research/AI/long-context/longer-contexts"],
      [
        "/research/data-science/decision-optimisation/continuous-outcomes",
        "/research/machine-learning/decision-optimisation/continuous-outcomes",
      ],
      ["/research/data-science/decision-optimisation/drift", "/research/machine-learning/decision-optimisation/drift"],
      [
        "/research/data-science/decision-optimisation/dynamic-decisions",
        "/research/machine-learning/decision-optimisation/dynamic-decisions",
      ],
      [
        "/research/data-science/decision-optimisation/profit-curves",
        "/research/machine-learning/decision-optimisation/profit-curves",
      ],
      [
        "/research/data-science/interpretability/feature-importance",
        "/research/machine-learning/interpretability/feature-importance",
      ],
      [
        "/research/data-science/interpretability/partial-dependence-and-ale",
        "/research/machine-learning/interpretability/partial-dependence-and-ale",
      ],
      [
        "/research/data-science/interpretability/population-stability-index",
        "/research/machine-learning/interpretability/population-stability-index",
      ],
      [
        "/research/data-science/machine-learning/classification-metrics",
        "/research/machine-learning/classification-metrics",
      ],
      [
        "/research/data-science/machine-learning/gain-lift-and-deciles",
        "/research/machine-learning/gain-lift-and-deciles",
      ],
      ["/research/data-science/machine-learning/imbalanced-data", "/research/machine-learning/imbalanced-data"],
      ["/research/data-science/machine-learning/random-forests", "/research/machine-learning/random-forests"],
      ["/research/data-science/maths/calculus/chain-rule", "/research/maths/chain-rule"],
      ["/research/data-science/maths/calculus/partial-derivatives", "/research/maths/partial-derivatives"],
      ["/research/data-science/maths/calculus/product-rule", "/research/maths/product-rule"],
      ["/research/data-science/maths/calculus/quotient-rule", "/research/maths/quotient-rule"],
      ["/research/data-science/maths/gradient-descent", "/research/machine-learning/gradient-descent"],
      ["/research/data-science/reading-list", "/research/reading-list"],
      ["/research/data-science/statistics/bayesian-data-analysis", "/research/statistics/bayesian-data-analysis"],
      ["/research/data-science/statistics/descriptive-statistics", "/research/statistics/descriptive-statistics"],
      ["/research/data-science/statistics/hypothesis-testing", "/research/statistics/hypothesis-testing"],
      ["/research/data-science/statistics/linear-regression", "/research/statistics/linear-regression"],
      ["/research/data-science/statistics/logistic-regression", "/research/statistics/logistic-regression"],
      ["/research/data-science/statistics/probability", "/research/statistics/probability"],
      [
        "/research/data-science/tools/geospatial/geopandas-and-projections",
        "/research/tools/geospatial/geopandas-and-projections",
      ],
      [
        "/research/data-science/tools/geospatial/joins-and-proximity",
        "/research/tools/geospatial/joins-and-proximity",
      ],
      ["/research/data-science/tools/image-processing", "/research/tools/image-processing"],
      ["/research/data-science/tools/matplotlib", "/research/tools/matplotlib"],
      ["/research/data-science", "/research"],
      ["/research/data-science/maths", "/research/maths"],
      ["/research/data-science/maths/calculus", "/research/maths"],
      ["/research/data-science/statistics", "/research/statistics"],
      ["/research/data-science/tools", "/research/tools"],
      ["/research/data-science/tools/geospatial", "/research/tools/geospatial"],
      ["/research/data-science/machine-learning", "/research/machine-learning"],
      ["/research/data-science/interpretability", "/research/machine-learning/interpretability"],
      ["/research/data-science/decision-optimisation", "/research/machine-learning/decision-optimisation"],
      ["/research/AI/papers", "/research/AI/long-context"],
      ["/research/AI/questions", "/research/AI"],
      ...["chain-rule", "product-rule", "quotient-rule", "partial-derivatives"].map((slug) => [
        `/posts/${slug}`,
        `/research/maths/${slug}`,
      ]),
      // Blog posts that became research notes (2026-11-01).
      ["/posts/trapezium-rule", "/research/maths/trapezium-rule"],
      ["/posts/solving-second-degree-equations-deriving-the-quadratic-formula", "/research/maths/quadratic-formula"],
      ["/posts/microeconomics-for-managers-chapter-2", "/research/economics/microeconomics-for-managers-chapter-2"],
      ["/posts/bioinformatics", "/research/biology/bioinformatics"],
      ["/posts/scrapy-notes", "/research/tools/scrapy"],
      ["/posts/programming-cheatsheet", "/research/tools/programming-cheatsheet"],
    ];
    return moved.map(([source, destination]) => ({ source, destination, permanent: true }));
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

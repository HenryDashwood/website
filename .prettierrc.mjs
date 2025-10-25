/**
 * @type {import('prettier').Config}
 */
const config = {
  semi: true,
  trailingComma: "es5",
  singleQuote: false,
  printWidth: 119,
  tabWidth: 2,
  useTabs: false,
  proseWrap: "preserve",
  // Modern Prettier 3+ options
  plugins: ["prettier-plugin-organize-imports"],
  overrides: [
    {
      files: ["*.md", "*.mdx"],
      options: {
        proseWrap: "preserve",
        printWidth: 80,
      },
    },
  ],
};

export default config;

import type { Options as RehypePrettyCodeOptions } from "rehype-pretty-code";

export const SHIKI_LIGHT_THEME = "slack-ochin";

export const rehypePrettyCodeOptions: RehypePrettyCodeOptions = {
  theme: SHIKI_LIGHT_THEME,
  defaultLang: {
    block: "plaintext",
    inline: "plaintext",
  },
  keepBackground: false,
};

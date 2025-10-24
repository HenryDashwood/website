import type { MDXComponents } from "mdx/types";
import LocalImage, { LocalImageSideBySide, LocalImageGrid } from "@/components/LocalImage";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
    LocalImage,
    LocalImageSideBySide,
    LocalImageGrid,
  };
}

import LocalImage, { LocalImageGrid, LocalImageSideBySide } from "@/components/LocalImage";
import type { MDXComponents } from "mdx/types";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
    LocalImage,
    LocalImageSideBySide,
    LocalImageGrid,
  };
}

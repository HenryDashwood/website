import LocalImage, { LocalImageGrid, LocalImageSideBySide } from "@/components/LocalImage";
import TableWrapper from "@/components/TableWrapper";
import type { MDXComponents } from "mdx/types";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
    LocalImage,
    LocalImageSideBySide,
    LocalImageGrid,
    table: TableWrapper,
  };
}

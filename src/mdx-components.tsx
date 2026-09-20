import type { MDXComponents } from "mdx/types";

import CodeFigure from "@/components/CodeFigure";
import LocalImage, { LocalImageGrid, LocalImageSideBySide } from "@/components/LocalImage";
import TableWrapper from "@/components/TableWrapper";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
    LocalImage,
    LocalImageSideBySide,
    LocalImageGrid,
    figure: CodeFigure,
    table: TableWrapper,
  };
}

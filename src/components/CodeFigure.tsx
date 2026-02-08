"use client";

import { HTMLAttributes, ReactNode, useRef } from "react";

import CodeBlockControls from "./CodeBlockControls";

type FigureProps = HTMLAttributes<HTMLElement> & {
  children?: ReactNode;
  "data-rehype-pretty-code-figure"?: string;
};

export default function CodeFigure({ children, className, ...props }: FigureProps) {
  const figureRef = useRef<HTMLElement>(null);
  const isCodeFigure = props["data-rehype-pretty-code-figure"] !== undefined;

  if (!isCodeFigure) {
    return (
      <figure className={className} {...props}>
        {children}
      </figure>
    );
  }

  return (
    <figure ref={figureRef} className={["code-figure", className].filter(Boolean).join(" ")} {...props}>
      <CodeBlockControls figureRef={figureRef} />
      {children}
    </figure>
  );
}

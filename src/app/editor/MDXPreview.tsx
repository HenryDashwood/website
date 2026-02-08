"use client";

import { compile, run } from "@mdx-js/mdx";
import { ErrorInfo, Component as ReactComponent, ReactNode, useCallback, useEffect, useState } from "react";
import * as runtime from "react/jsx-runtime";
import rehypeKatex from "rehype-katex";
import rehypePrettyCode from "rehype-pretty-code";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

import CodeFigure from "@/components/CodeFigure";
// Import blog components for preview
import LaborMarketDiagram from "@/components/blog_components/LaborMarketDiagram";
import MigrationStabilityViz from "@/components/blog_components/MigrationStabilityViz";
import PowerLawViz from "@/components/blog_components/PowerLawViz";
import { rehypePrettyCodeOptions } from "@/lib/rehypePrettyCode";

// Error boundary to catch render errors from undefined components
interface ErrorBoundaryProps {
  children: ReactNode;
  onError: (error: Error) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class MDXErrorBoundary extends ReactComponent<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("MDX render error:", error, errorInfo);
    this.props.onError(error);
  }

  render() {
    if (this.state.hasError) {
      return null; // Parent will show the error
    }
    return this.props.children;
  }
}

// Fallback component for unknown/undefined components
function UnknownComponent({ componentName, ...props }: { componentName: string; [key: string]: unknown }) {
  return (
    <div className="my-2 rounded-lg border-2 border-dashed border-amber-400 bg-amber-50 p-3">
      <div className="flex items-center gap-2 text-amber-700">
        <span className="text-lg">⚠️</span>
        <span className="font-medium">Unknown component: </span>
        <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-sm">{componentName}</code>
      </div>
      {Object.keys(props).length > 0 && (
        <div className="mt-2 text-xs text-amber-600">Props: {Object.keys(props).join(", ")}</div>
      )}
    </div>
  );
}

// Preview-friendly versions of image components (using <img> instead of next/image)
type ImageSize = "small" | "medium" | "large" | "xlarge" | "full";

interface PreviewLocalImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  size?: ImageSize;
  className?: string;
  priority?: boolean;
  children?: ReactNode;
  caption?: string;
}

const sizeMap: Record<ImageSize, string> = {
  small: "max-w-sm",
  medium: "max-w-md",
  large: "max-w-lg",
  xlarge: "max-w-xl",
  full: "max-w-full",
};

function PreviewLocalImage({ src, alt, size = "large", className = "", children, caption }: PreviewLocalImageProps) {
  const maxWidthClass = sizeMap[size];

  return (
    <div className={`m-4 flex flex-col items-center p-4 ${className}`}>
      <div className={`w-full ${maxWidthClass} overflow-hidden`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className="h-auto w-full rounded-lg shadow-lg" />
      </div>
      {caption && (
        <div className={`mt-2 ${maxWidthClass} text-center text-sm wrap-break-word text-gray-600 italic`}>
          {caption}
        </div>
      )}
      {children && (
        <div className={`mt-2 ${maxWidthClass} text-center text-sm wrap-break-word text-gray-600`}>{children}</div>
      )}
    </div>
  );
}

interface PreviewLocalImageGridProps {
  images: {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    children?: ReactNode;
    caption?: string;
  }[];
  columns?: 2 | 3 | 4;
  className?: string;
}

function PreviewLocalImageGrid({ images, columns = 2, className = "" }: PreviewLocalImageGridProps) {
  const gridCols = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={`grid ${gridCols[columns]} m-4 justify-items-center gap-4 p-4 ${className}`}>
      {images.map((image, index) => (
        <div key={index} className="flex w-full max-w-full flex-col items-center overflow-hidden">
          <div className="w-full max-w-full overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image.src} alt={image.alt} className="h-auto w-full max-w-full rounded-lg shadow-lg" />
          </div>
          {image.caption && (
            <div className="mt-2 max-w-full text-center text-sm wrap-break-word text-gray-600 italic">
              {image.caption}
            </div>
          )}
          {image.children && (
            <div className="mt-2 max-w-full text-center text-sm wrap-break-word text-gray-600">{image.children}</div>
          )}
        </div>
      ))}
    </div>
  );
}

interface PreviewLocalImageSideBySideProps {
  images: {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    children?: ReactNode;
    caption?: string;
  }[];
  className?: string;
}

function PreviewLocalImageSideBySide({ images, className = "" }: PreviewLocalImageSideBySideProps) {
  return (
    <div className={`m-4 grid grid-cols-1 justify-items-center gap-4 p-4 sm:grid-cols-2 ${className}`}>
      {images.map((image, index) => (
        <div key={index} className="flex w-full max-w-full flex-col items-center overflow-hidden">
          <div className="w-full max-w-full overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image.src} alt={image.alt} className="h-auto w-full max-w-full rounded-lg shadow-lg" />
          </div>
          {image.caption && (
            <div className="mt-2 max-w-full text-center text-sm wrap-break-word text-gray-600 italic">
              {image.caption}
            </div>
          )}
          {image.children && (
            <div className="mt-2 max-w-full text-center text-sm wrap-break-word text-gray-600">{image.children}</div>
          )}
        </div>
      ))}
    </div>
  );
}

function PreviewTableWrapper({ children }: { children: ReactNode }) {
  return (
    <div className="w-full overflow-x-auto [-webkit-overflow-scrolling:touch] md:overflow-x-visible">
      <table>{children}</table>
    </div>
  );
}

// MDX components for preview - known components
const knownComponents = {
  LocalImage: PreviewLocalImage,
  LocalImageGrid: PreviewLocalImageGrid,
  LocalImageSideBySide: PreviewLocalImageSideBySide,
  figure: CodeFigure,
  table: PreviewTableWrapper,
  // Blog components
  LaborMarketDiagram,
  MigrationStabilityViz,
  PowerLawViz,
} as unknown as Record<string, React.ComponentType>;

// Proxy to catch unknown components and show a placeholder
const mdxComponents = new Proxy(knownComponents, {
  get(target, prop: string) {
    if (prop in target) {
      return target[prop];
    }
    // For unknown components, return a placeholder
    // Skip HTML elements (lowercase) and React internals
    if (typeof prop === "string" && prop[0] === prop[0].toUpperCase() && !prop.startsWith("_")) {
      return function UnknownComponentWrapper(props: Record<string, unknown>) {
        return <UnknownComponent componentName={prop} {...props} />;
      };
    }
    return undefined;
  },
});

interface MDXPreviewProps {
  content: string;
  className?: string;
}

export default function MDXPreview({ content, className = "" }: MDXPreviewProps) {
  const [Component, setComponent] = useState<React.ComponentType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [renderKey, setRenderKey] = useState(0); // Used to reset error boundary

  const handleRenderError = useCallback((err: Error) => {
    // Format error message to be more helpful
    let message = err.message;
    // Check for undefined component errors
    if (message.includes("is not defined") || message.includes("is not a function")) {
      const match = message.match(/(\w+) is not (defined|a function)/);
      if (match) {
        message = `Component "${match[1]}" is not defined. Make sure to import it or add it to the preview components.`;
      }
    }
    setError(message);
  }, []);

  const compileMDX = useCallback(async (mdxContent: string) => {
    setIsCompiling(true);
    setError(null);
    setRenderKey((k) => k + 1); // Reset error boundary on new compile

    try {
      // Strip import statements since we provide components directly via the components prop
      // This handles both single-line and multi-line imports
      const contentWithoutImports = mdxContent
        .replace(/^import\s+.*?from\s+['"].*?['"];?\s*$/gm, "")
        .replace(/^import\s+{[^}]*}\s+from\s+['"].*?['"];?\s*$/gm, "")
        .replace(/^import\s+['"].*?['"];?\s*$/gm, "");

      const compiled = await compile(contentWithoutImports, {
        outputFormat: "function-body",
        remarkPlugins: [remarkGfm, remarkMath],
        rehypePlugins: [rehypeKatex, [rehypePrettyCode, rehypePrettyCodeOptions]],
      });

      const { default: MDXContent } = await run(
        String(compiled),
        // @ts-expect-error React jsx-runtime types don't match MDX RunOptions exactly
        { ...runtime, baseUrl: import.meta.url }
      );

      setComponent(() => MDXContent);
    } catch (err) {
      console.error("MDX compilation error:", err);
      setError(err instanceof Error ? err.message : "Failed to compile MDX");
      setComponent(null);
    } finally {
      setIsCompiling(false);
    }
  }, []);

  // Debounce the compilation
  const debouncedContent = useDebounce(content, 300);

  useEffect(() => {
    if (debouncedContent) {
      compileMDX(debouncedContent);
    }
  }, [debouncedContent, compileMDX]);

  if (error) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="rounded-lg border border-red-300 bg-red-50 p-4">
          <h3 className="mb-2 font-bold text-red-700">Compilation Error</h3>
          <pre className="overflow-auto text-sm whitespace-pre-wrap text-red-600">{error}</pre>
        </div>
      </div>
    );
  }

  if (isCompiling && !Component) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-gray-500">Compiling MDX...</div>
      </div>
    );
  }

  if (!Component) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-gray-500">Enter some MDX to see the preview</div>
      </div>
    );
  }

  return (
    <div className={`prose-content ${className}`}>
      {isCompiling && (
        <div className="fixed top-4 right-4 rounded bg-yellow-100 px-3 py-1 text-sm text-yellow-800">Compiling...</div>
      )}
      <MDXErrorBoundary key={renderKey} onError={handleRenderError}>
        {/* @ts-expect-error MDX compiled component accepts components prop */}
        <Component components={mdxComponents} />
      </MDXErrorBoundary>
    </div>
  );
}

// Custom debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

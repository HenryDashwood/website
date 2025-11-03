import Image from "next/image";
import { ReactNode } from "react";

type ImageSize = "small" | "medium" | "large" | "xlarge" | "full";

interface LocalImageProps {
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
  small: "max-w-sm", // 384px
  medium: "max-w-md", // 448px
  large: "max-w-lg", // 512px
  xlarge: "max-w-xl", // 576px
  full: "max-w-full", // 100%
};

export default function LocalImage({
  src,
  alt,
  width = 600,
  height = 400,
  size = "large",
  className = "",
  priority = false,
  children,
  caption,
}: LocalImageProps) {
  const maxWidthClass = sizeMap[size];

  return (
    <div className={`m-4 flex flex-col items-center p-4 ${className}`}>
      <div className={`w-full ${maxWidthClass} overflow-hidden`}>
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          priority={priority}
          className="h-auto w-full rounded-lg shadow-lg"
        />
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

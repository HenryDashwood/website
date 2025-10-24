import Image from "next/image";
import { ReactNode } from "react";

interface LocalImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  children?: ReactNode;
  caption?: string;
}

export default function LocalImage({
  src,
  alt,
  width = 600,
  height = 400,
  className = "",
  priority = false,
  children,
  caption,
}: LocalImageProps) {
  return (
    <div className={`flex flex-col items-center m-4 p-4 ${className}`}>
      <div className="w-full max-w-full overflow-hidden">
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          priority={priority}
          className="rounded-lg shadow-lg w-full h-auto max-w-full"
        />
      </div>
      {caption && (
        <div className="mt-2 text-sm text-gray-600 text-center italic break-words max-w-full">{caption}</div>
      )}
      {children && <div className="mt-2 text-sm text-gray-600 text-center break-words max-w-full">{children}</div>}
    </div>
  );
}

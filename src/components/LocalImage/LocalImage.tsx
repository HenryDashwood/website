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
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        className="rounded-lg shadow-lg"
      />
      {caption && (
        <div className="mt-2 text-sm text-gray-600 text-center italic">
          {caption}
        </div>
      )}
      {children && (
        <div className="mt-2 text-sm text-gray-600 text-center">{children}</div>
      )}
    </div>
  );
}

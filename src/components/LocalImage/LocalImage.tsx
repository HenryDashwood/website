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
    <div className={`m-4 flex flex-col items-center p-4 ${className}`}>
      <div className="w-full max-w-full overflow-hidden">
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          priority={priority}
          className="h-auto w-full max-w-full rounded-lg shadow-lg"
        />
      </div>
      {caption && (
        <div className="mt-2 max-w-full text-center text-sm wrap-break-word text-gray-600 italic">{caption}</div>
      )}
      {children && <div className="mt-2 max-w-full text-center text-sm wrap-break-word text-gray-600">{children}</div>}
    </div>
  );
}

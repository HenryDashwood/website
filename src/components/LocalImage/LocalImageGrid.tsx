import Image from "next/image";
import { ReactNode } from "react";

interface LocalImageGridProps {
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

export default function LocalImageGrid({
  images,
  columns = 2,
  className = "",
}: LocalImageGridProps) {
  const gridCols = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div
      className={`grid ${gridCols[columns]} gap-4 justify-items-center m-4 p-4 ${className}`}
    >
      {images.map((image, index) => (
        <div key={index} className="flex flex-col items-center">
          <Image
            src={image.src}
            alt={image.alt}
            width={image.width || 300}
            height={image.height || 200}
            className="rounded-lg shadow-lg"
          />
          {image.caption && (
            <div className="mt-2 text-sm text-gray-600 text-center italic">
              {image.caption}
            </div>
          )}
          {image.children && (
            <div className="mt-2 text-sm text-gray-600 text-center">
              {image.children}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

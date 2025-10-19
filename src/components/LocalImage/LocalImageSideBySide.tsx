import Image from "next/image";
import { ReactNode } from "react";

interface LocalImageSideBySideProps {
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

export default function LocalImageSideBySide({
  images,
  className = "",
}: LocalImageSideBySideProps) {
  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-2 gap-4 justify-items-center m-4 p-4 ${className}`}
    >
      {images.map((image, index) => (
        <div key={index} className="flex flex-col items-center">
          <Image
            src={image.src}
            alt={image.alt}
            width={image.width || 400}
            height={image.height || 300}
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

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

export default function LocalImageSideBySide({ images, className = "" }: LocalImageSideBySideProps) {
  return (
    <div className={`m-4 grid grid-cols-1 justify-items-center gap-4 p-4 sm:grid-cols-2 ${className}`}>
      {images.map((image, index) => (
        <div key={index} className="flex w-full max-w-full flex-col items-center overflow-hidden">
          <div className="w-full max-w-full overflow-hidden">
            <Image
              src={image.src}
              alt={image.alt}
              width={image.width || 400}
              height={image.height || 300}
              className="h-auto w-full max-w-full rounded-lg shadow-lg"
            />
          </div>
          {image.caption && (
            <div className="mt-2 max-w-full text-center text-sm break-words text-gray-600 italic">{image.caption}</div>
          )}
          {image.children && (
            <div className="mt-2 max-w-full text-center text-sm break-words text-gray-600">{image.children}</div>
          )}
        </div>
      ))}
    </div>
  );
}

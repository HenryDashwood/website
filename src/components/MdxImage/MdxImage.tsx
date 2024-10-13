import React from "react";
import Image, { ImageProps } from "next/image";

export default function MdxImage(props: ImageProps) {
  return <Image {...props} alt={props.alt} />;
}

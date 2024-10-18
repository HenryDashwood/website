import type { Metadata } from "next";

import PostPage from "@/components/PostPage";
import { PostMetadata } from "@/lib/posts";

export const metadata: Metadata = {
  title: "Bioinformatics",
  description: "Notes on bioinformatics",
  openGraph: {
    images: [
      {
        url: `${process.env.WEBSITE_URL}/api/og?title=Bioinformatics`,
      },
    ],
  },
};

export const postMetadata: PostMetadata = {
  id: 5,
  title: metadata.title as string,
  slug: "bioinformatics",
  published: "2023-02-16",
  tags: ["Biology"],
};

export default function Post() {
  return <PostPage postMetadata={postMetadata} />;
}

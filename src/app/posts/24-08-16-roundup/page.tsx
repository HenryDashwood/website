import { PostMetadata } from "@/lib/posts";
import PostPage from "@/components/PostPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "24-08-16 Roundup",
  description: "Some links from the last month",
  openGraph: {
    images: [
      {
        url: `${process.env.WEBSITE_URL}/api/og?title=24-08-16-Roundup`,
      },
    ],
  },
};

export const postMetadata: PostMetadata = {
  id: 2,
  title: "24-08-16 Roundup",
  slug: "24-08-16-roundup",
  published: "2024-08-16",
  tags: ["Roundups"],
};

export default function Post() {
  return <PostPage postMetadata={postMetadata} />;
}

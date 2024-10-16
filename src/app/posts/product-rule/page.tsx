import PostPage from "@/components/PostPage";
import { PostMetadata } from "@/lib/posts";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Product rule",
  description: "The product rule",
  openGraph: {
    images: [
      {
        url: `${process.env.WEBSITE_URL}/api/og?title=Product%20rule`,
      },
    ],
  },
};

export const postMetadata: PostMetadata = {
  id: 7,
  title: "Product rule",
  slug: "product-rule",
  published: "2023-04-27",
  tags: ["Mathematics"],
};

export default function Post() {
  return <PostPage postMetadata={postMetadata} />;
}
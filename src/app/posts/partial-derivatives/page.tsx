import { PostMetadata } from "@/lib/posts";
import PostPage from "@/components/PostPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Partial derivatives",
  description: "Partial derivatives",
  openGraph: {
    images: [
      {
        url: `${process.env.WEBSITE_URL}/api/og?title=Partial%20derivatives`,
      },
    ],
  },
};

export const postMetadata: PostMetadata = {
  id: 2,
  title: "Partial derivatives",
  slug: "partial-derivatives",
  published: "2023-04-27",
  tags: ["Mathematics"],
};

export default function Post() {
  return <PostPage postMetadata={postMetadata} />;
}

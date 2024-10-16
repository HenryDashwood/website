import PostPage from "@/components/PostPage";
import { PostMetadata } from "@/lib/posts";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Books",
  description: "List of books I read",
  openGraph: {
    images: [
      {
        url: `${process.env.WEBSITE_URL}/api/og?title=Books`,
      },
    ],
  },
};

export const postMetadata: PostMetadata = {
  id: 6,
  title: "Books",
  slug: "books",
  published: "2023-02-19",
  tags: ["Literature"],
};

export default function Post() {
  return <PostPage postMetadata={postMetadata} />;
}

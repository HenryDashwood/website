import { PostMetadata } from "@/lib/posts";
import PostPage from "@/components/PostPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Microeconomics for managers chapter 2",
  description: "Microeconomics for managers chapter 2",
  openGraph: {
    images: [
      {
        url: `${process.env.WEBSITE_URL}/api/og?title=Weltanschauung`,
      },
    ],
  },
};

export const postMetadata: PostMetadata = {
  id: 2,
  title: "Microeconomics for managers chapter 2",
  slug: "microeconomics-for-managers-chapter-2",
  published: "2023-10-11",
  tags: ["Economics"],
};

export default function Post() {
  return <PostPage postMetadata={postMetadata} />;
}

import PostPage from "@/components/PostPage";
import { PostMetadata } from "@/lib/posts";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Programming Cheatsheet",
  description: "Cheatsheet for programming",
  openGraph: {
    images: [
      {
        url: `${process.env.WEBSITE_URL}/api/og?title=Programming%20Cheatsheet`,
      },
    ],
  },
};

export const postMetadata: PostMetadata = {
  id: 6,
  title: "Programming Cheatsheet",
  slug: "programming-cheatsheet",
  published: "2020-09-11",
  tags: ["Programming"],
};

export default function Post() {
  return <PostPage postMetadata={postMetadata} />;
}

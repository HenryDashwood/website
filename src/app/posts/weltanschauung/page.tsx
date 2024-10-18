import { PostMetadata } from "@/lib/posts";
import PostPage from "@/components/PostPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Weltanschauung",
  description: "My worldview",
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
  title: "Weltanschauung",
  slug: "weltanschauung",
  published: "2023-02-14",
  tags: ["Recommendations"],
};

export default function Post() {
  return <PostPage postMetadata={postMetadata} />;
}

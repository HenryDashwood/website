import { PostMetadata } from "@/lib/posts";
import PostPage from "@/components/PostPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "24-06 Links",
  description: "Some links from the last month",
  openGraph: {
    images: [
      {
        url: `${process.env.WEBSITE_URL}/api/og?title=24-06-Links`,
      },
    ],
  },
};

export const postMetadata: PostMetadata = {
  id: 2,
  title: "24-06 Links",
  slug: "24-06-links",
  published: "2024-06-30",
  tags: ["Roundups"],
};

export default function Post() {
  return <PostPage postMetadata={postMetadata} />;
}

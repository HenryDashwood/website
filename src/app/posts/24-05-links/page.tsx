import { PostMetadata } from "@/lib/posts";
import PostPage from "@/components/PostPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "24-05 Links",
  description: "Some links from the last month",
  openGraph: {
    images: [
      {
        url: `${process.env.WEBSITE_URL}/api/og?title=24-05-Links`,
      },
    ],
  },
};

export const postMetadata: PostMetadata = {
  id: 2,
  title: "24-05 Links",
  slug: "24-05-links",
  published: "2024-05-24",
  tags: ["Roundups"],
};

export default function Post() {
  return <PostPage postMetadata={postMetadata} />;
}

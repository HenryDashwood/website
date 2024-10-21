import { PostMetadata } from "@/lib/posts";
import PostPage from "@/components/PostPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Scrapy notes",
  description: "Scrapy notes",
  openGraph: {
    images: [
      {
        url: `${process.env.WEBSITE_URL}/api/og?title=Scrapy%20notes`,
      },
    ],
  },
};

export const postMetadata: PostMetadata = {
  id: 1,
  title: "Scrapy notes",
  slug: "scrapy-notes",
  published: "2024-01-16",
  tags: ["Programming"],
};

export default function Post() {
  return <PostPage postMetadata={postMetadata} />;
}

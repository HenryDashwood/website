import { PostMetadata } from "@/lib/posts";
import PostPage from "@/components/PostPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quotient rule",
  description: "The quotient rule",
  openGraph: {
    images: [
      {
        url: `${process.env.WEBSITE_URL}/api/og?title=Quotient%20rule`,
      },
    ],
  },
};

export const postMetadata: PostMetadata = {
  id: 2,
  title: "Quotient rule",
  slug: "quotient-rule",
  published: "2023-04-27",
  tags: ["Mathematics"],
};

export default function Post() {
  return <PostPage postMetadata={postMetadata} />;
}

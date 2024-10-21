import { PostMetadata } from "@/lib/posts";
import PostPage from "@/components/PostPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "University of Waterloo",
  description: "Some thoughts on the University of Waterloo",
  openGraph: {
    images: [
      {
        url: `${process.env.WEBSITE_URL}/api/og?title=University of Waterloo`,
      },
    ],
  },
};

export const postMetadata: PostMetadata = {
  id: 2,
  title: "University of Waterloo",
  slug: "university-of-waterloo",
  published: "2024-04-20",
  tags: [],
};

export default function Post() {
  return <PostPage postMetadata={postMetadata} />;
}

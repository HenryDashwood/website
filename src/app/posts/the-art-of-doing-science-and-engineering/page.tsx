import { PostMetadata } from "@/lib/posts";
import PostPage from "@/components/PostPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Art of Doing Science and Engineering",
  description: "The Art of Doing Science and Engineering",
  openGraph: {
    images: [
      {
        url: `${process.env.WEBSITE_URL}/api/og?title=The%20Art%20of%20Doing%20Science%20and%20Engineering`,
      },
    ],
  },
};

export const postMetadata: PostMetadata = {
  id: 2,
  title: "The Art of Doing Science and Engineering",
  slug: "the-art-of-doing-science-and-engineering",
  published: "2023-11-14",
  tags: ["Mathematics"],
};

export default function Post() {
  return <PostPage postMetadata={postMetadata} />;
}

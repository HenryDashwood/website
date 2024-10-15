import PostPage from "@/components/PostPage";
import { PostMetadata } from "@/lib/posts";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Publications",
  description: "List of publications I read",
  openGraph: {
    images: [
      {
        url: `${process.env.WEBSITE_URL}/api/og?title=Publications`,
      },
    ],
  },
};

export const postMetadata: PostMetadata = {
  id: 4,
  title: "Publications",
  slug: "publications",
  published: "2023-02-15",
  tags: ["Recommendations"],
};

export default function Post() {
  return <PostPage postMetadata={postMetadata} />;
}

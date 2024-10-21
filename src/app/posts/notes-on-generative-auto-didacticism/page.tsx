import { PostMetadata } from "@/lib/posts";
import PostPage from "@/components/PostPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notes on Generative Auto-Didacticism",
  description: "Notes on a better way to teach",
  openGraph: {
    images: [
      {
        url: `${process.env.WEBSITE_URL}/api/og?title=Notes on Generative Auto-Didacticism`,
      },
    ],
  },
};

export const postMetadata: PostMetadata = {
  id: 2,
  title: "Notes on Generative Auto-Didacticism",
  slug: "notes-on-generative-auto-didacticism",
  published: "2024-04-07",
  tags: [],
};

export default function Post() {
  return <PostPage postMetadata={postMetadata} />;
}

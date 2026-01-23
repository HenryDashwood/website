import PostPage from "@/components/PostPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "How to Think About Self-Attention Intuitively",
  description: "An example of how to think about self-attention in an intuitive way",
  openGraph: {
    images: [
      {
        url: `${process.env.WEBSITE_URL}/api/og?title=How%20to%20Think%20About%20Self-Attention%20Intuitively`,
      },
    ],
  },
  other: {
    slug: "attention-intuition",
    published: "2026-01-23",
    tags: ["AI"],
  },
};

export default function Post() {
  return <PostPage metadata={metadata} />;
}

import PostPage from "@/components/PostPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Why Cities Exist: The Fundamental Trade-off",
  description: "My worldview",
  openGraph: {
    images: [
      {
        url: `${process.env.WEBSITE_URL}/api/og?title=Why%20Cities%20Exist`,
      },
    ],
  },
  other: {
    slug: "why-cities-exist",
    published: "2025-10-26",
    tags: ["Economics", "Housing"],
  },
};

export default function Post() {
  return <PostPage metadata={metadata} />;
}

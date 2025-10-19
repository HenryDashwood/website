import PostPage from "@/components/PostPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "California: 1769-1848",
  description: "History of California from 1769 to 1848",
  openGraph: {
    images: [
      {
        url: `${process.env.WEBSITE_URL}/api/og?title=California%3A%201769-1848`,
      },
    ],
  },
  other: {
    slug: "california-1769-1848",
    published: "2025-10-19",
    tags: ["History"],
  },
};

export default function Post() {
  return <PostPage metadata={metadata} />;
}

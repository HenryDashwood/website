import PostPage from "@/components/PostPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "California: the first three centuries",
  description: "History of the settlement of California",
  openGraph: {
    images: [
      {
        url: `${process.env.WEBSITE_URL}/api/og?title=California%3A%20the%20first%20three%20centuries`,
      },
    ],
  },
  other: {
    slug: "california-the-first-three-centuries",
    published: "2024-10-09",
    tags: ["History"],
  },
};

export default function Post() {
  return <PostPage metadata={metadata} />;
}

import PostPage from "@/components/PostPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "25-02-21 Roundup",
  description: "Some links from the last month",
  openGraph: {
    images: [
      {
        url: `${process.env.WEBSITE_URL}/api/og?title=25-02-21-Roundup`,
      },
    ],
  },
  other: {
    slug: "25-02-21-roundup",
    published: "2025-02-21",
    tags: ["Roundups"],
  },
};

export default function Post() {
  return <PostPage metadata={metadata} />;
}

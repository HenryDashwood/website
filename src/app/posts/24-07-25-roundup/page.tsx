import PostPage from "@/components/PostPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "24-07-25 Roundup",
  description: "Some links from the last month",
  openGraph: {
    images: [
      {
        url: `${process.env.WEBSITE_URL}/api/og?title=24-07-25-Roundup`,
      },
    ],
  },
  other: {
    slug: "24-07-25-roundup",
    published: "2024-07-25",
    tags: ["Roundups"],
  },
};

export default function Post() {
  return <PostPage metadata={metadata} />;
}

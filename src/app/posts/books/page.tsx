import PostPage from "@/components/PostPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Books",
  description: "List of books I read",
  openGraph: {
    images: [
      {
        url: `${process.env.WEBSITE_URL}/api/og?title=Books`,
      },
    ],
  },
  other: {
    slug: "books",
    published: "2023-02-19",
    tags: ["Literature"],
  },
};

export default function Post() {
  return <PostPage metadata={metadata} />;
}

import PostPage from "@/components/PostPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Programming Cheatsheet",
  description: "Cheatsheet for programming",
  openGraph: {
    images: [
      {
        url: `${process.env.WEBSITE_URL}/api/og?title=Programming%20Cheatsheet`,
      },
    ],
  },
  other: {
    slug: "programming-cheatsheet",
    published: "2023-02-17",
    tags: ["Programming"],
  },
};

export default function Post() {
  return <PostPage metadata={metadata} />;
}

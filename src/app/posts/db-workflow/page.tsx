import PostPage from "@/components/PostPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "DB Workflow",
  description: "An ORM-free DB workflow I like",
  openGraph: {
    images: [
      {
        url: `${process.env.WEBSITE_URL}/api/og?title=DB%20Workflow`,
      },
    ],
  },
  other: {
    slug: "db-workflow",
    published: "2025-08-25",
    tags: ["Programming"],
  },
};

export default function Post() {
  return <PostPage metadata={metadata} />;
}

import PostPage from "@/components/PostPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "The trapezium rule",
  description: "The trapezium rule",
  openGraph: {
    images: [
      {
        url: `${process.env.WEBSITE_URL}/api/og?title=The%20trapezium%20rule`,
      },
    ],
  },
  other: {
    slug: "trapezium-rule",
    published: "2024-01-06",
    tags: ["Mathematics"],
  },
};

export default function Post() {
  return <PostPage metadata={metadata} />;
}

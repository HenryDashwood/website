import PostPage from "@/components/PostPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Weltanschauung",
  description: "My worldview",
  openGraph: {
    images: [
      {
        url: `${process.env.WEBSITE_URL}/api/og?title=Weltanschauung`,
      },
    ],
  },
  other: {
    slug: "weltanschauung",
    published: "2023-02-14",
    tags: ["Recommendations"],
  },
};

export default function Post() {
  return <PostPage metadata={metadata} />;
}

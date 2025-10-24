import PostPage from "@/components/PostPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ideas and Economic Growth",
  description: "Some notes on the role of ideas in economic growth and the paper Are Ideas Getting Harder to Find?",
  openGraph: {
    images: [
      {
        url: `${process.env.WEBSITE_URL}/api/og?title=Ideas%20and%20Economic%20Growth`,
      },
    ],
  },
  other: {
    slug: "ideas-and-economic-growth",
    published: "2024-11-10",
    tags: ["Economics"],
  },
};

export default function Post() {
  return <PostPage metadata={metadata} />;
}

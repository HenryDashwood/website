import PostPage from "@/components/PostPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Inside a City - The Alonso Muth Mills Model",
  description: "An introduction to the Alonso Muth Mills model in urban economics",
  openGraph: {
    images: [
      {
        url: `${process.env.WEBSITE_URL}/api/og?title=Inside%20a%20City%20-%20The%20Alonso%20Muth%20Mills%20Model`,
      },
    ],
  },
  other: {
    slug: "alonso-muth-mills-model",
    published: "2025-12-11",
    tags: ["Economics", "Housing"],
  },
};

export default function Post() {
  return <PostPage metadata={metadata} />;
}

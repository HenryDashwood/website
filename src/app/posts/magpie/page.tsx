import PostPage from "@/components/PostPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Magpie",
  description: "An app for reading and listening to articles and podcasts that can be operated entirely by voice",
  openGraph: {
    images: [
      {
        url: `${process.env.WEBSITE_URL}/api/og?title=Magpie`,
      },
    ],
  },
  other: {
    slug: "magpie",
    published: "2026-09-17",
    tags: ["Programming"],
  },
};

export default function Post() {
  return <PostPage metadata={metadata} />;
}

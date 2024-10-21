import PostPage from "@/components/PostPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "On Zero",
  description: "Notes on zero",
  openGraph: {
    images: [
      {
        url: `${process.env.WEBSITE_URL}/api/og?title=On%20Zero`,
      },
    ],
  },
  other: {
    slug: "on-zero",
    published: "2020-09-11",
    tags: ["Mathematics"],
  },
};

export default function Post() {
  return <PostPage metadata={metadata} />;
}

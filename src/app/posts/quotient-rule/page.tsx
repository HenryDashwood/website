import PostPage from "@/components/PostPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quotient rule",
  description: "The quotient rule",
  openGraph: {
    images: [
      {
        url: `${process.env.WEBSITE_URL}/api/og?title=Quotient%20rule`,
      },
    ],
  },
  other: {
    slug: "quotient-rule",
    published: "2023-04-27",
    tags: ["Mathematics"],
  },
};

export default function Post() {
  return <PostPage metadata={metadata} />;
}

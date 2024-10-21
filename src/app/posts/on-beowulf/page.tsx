import PostPage from "@/components/PostPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "On Beowulf",
  description: "Notes on Beowulf",
  openGraph: {
    images: [
      {
        url: `${process.env.WEBSITE_URL}/api/og?title=On%20Beowulf`,
      },
    ],
  },
  other: {
    slug: "on-beowulf",
    published: "2021-04-23",
    tags: ["Literature"],
  },
};

export default function Post() {
  return <PostPage metadata={metadata} />;
}

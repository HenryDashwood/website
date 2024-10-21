import PostPage from "@/components/PostPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Microeconomics for managers chapter 2",
  description: "Microeconomics for managers chapter 2",
  openGraph: {
    images: [
      {
        url: `${process.env.WEBSITE_URL}/api/og?title=Microeconomics%20for%20managers%20chapter%202`,
      },
    ],
  },
  other: {
    slug: "microeconomics-for-managers-chapter-2",
    published: "2023-10-11",
    tags: ["Economics"],
  },
};

export default function Post() {
  return <PostPage metadata={metadata} />;
}

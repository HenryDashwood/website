import PostPage from "@/components/PostPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Publications",
  description: "List of publications I read",
  openGraph: {
    images: [
      {
        url: `${process.env.WEBSITE_URL}/api/og?title=Publications`,
      },
    ],
  },
  other: {
    slug: "publications",
    published: "2023-02-15",
    tags: ["Recommendations"],
  },
};

export default function Post() {
  return <PostPage metadata={metadata} />;
}

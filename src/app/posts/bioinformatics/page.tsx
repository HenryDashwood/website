import type { Metadata } from "next";

import PostPage from "@/components/PostPage";

export const metadata: Metadata = {
  title: "Bioinformatics",
  description: "Notes on bioinformatics",
  openGraph: {
    images: [
      {
        url: `${process.env.WEBSITE_URL}/api/og?title=Bioinformatics`,
      },
    ],
  },
  other: {
    slug: "bioinformatics",
    published: "2023-02-16",
    tags: ["Biology"],
  },
};

export default function Post() {
  return <PostPage metadata={metadata} />;
}

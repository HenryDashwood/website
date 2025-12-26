import PostPage from "@/components/PostPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Across Cities: The Rosen-Roback Model",
  description: "An introduction to the Rosen-Roback model in urban economics",
  openGraph: {
    images: [{ url: `${process.env.WEBSITE_URL}/api/og?title=Across%20Cities%3A%20The%20Rosen-Roback%20Model` }],
  },
  other: {
    slug: "rosen-roback-model",
    published: "2025-12-26",
    tags: ["Economics", "Housing"],
  },
};

export default function Page() {
  return <PostPage metadata={metadata} />;
}

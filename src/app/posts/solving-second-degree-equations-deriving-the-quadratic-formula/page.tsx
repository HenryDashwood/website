import PostPage from "@/components/PostPage";
import { PostMetadata } from "@/lib/posts";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Solving second degree equations (deriving the quadratic formula)",
  description: "Deriving the quadratic formula",
  openGraph: {
    images: [
      {
        url: `${process.env.WEBSITE_URL}/api/og?title=Solving%20second%20degree%20equations%20(deriving%20the%20quadratic%20formula)`,
      },
    ],
  },
};

export const postMetadata: PostMetadata = {
  id: 7,
  title: "Solving second degree equations (deriving the quadratic formula)",
  slug: "solving-second-degree-equations-deriving-the-quadratic-formula",
  published: "2023-02-20",
  tags: ["Mathematics"],
};

export default function Post() {
  return <PostPage postMetadata={postMetadata} />;
}
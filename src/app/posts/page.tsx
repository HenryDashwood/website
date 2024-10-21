import type { Metadata } from "next";

import Link from "next/link";
import Date from "@/components/Date";
import Content from "@/components/Content";
import NavContentWrapper from "@/components/NavContentWrapper";
import { GetPosts } from "@/lib/posts";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Blog Posts",
  description: "Blog Posts",
  openGraph: {
    images: [
      {
        url: `${process.env.WEBSITE_URL}/api/og?title=Blog%20Posts`,
      },
    ],
  },
};

async function PostList() {
  const posts = await GetPosts(false);

  return (
    <NavContentWrapper>
      <Content>
        <h1>Blog Posts</h1>
        <ul className="list-none p-0">
          {posts.map((post) => {
            if (!post.metadata.other) return null;

            return (
              <li key={String(post.metadata.other.slug)} className="mb-4">
                <Link href={`/posts/` + post.metadata.other.slug}>
                  {String(post.metadata.title)}
                </Link>
                <br />
                <small>
                  <Date dateString={String(post.metadata.other.published)} />
                </small>
              </li>
            );
          })}
        </ul>
      </Content>
    </NavContentWrapper>
  );
}

export default PostList;

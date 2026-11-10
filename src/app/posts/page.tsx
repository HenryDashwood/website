import type { Metadata } from "next";
import Link from "next/link";

import Date from "@/components/Date";
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

interface PostRow {
  slug: string;
  title: string;
  published: string;
  tags: string[];
}

async function PostList() {
  const posts: PostRow[] = (await GetPosts(false)).flatMap((post) =>
    post.metadata.other
      ? [
          {
            slug: String(post.metadata.other.slug),
            title: String(post.metadata.title),
            published: String(post.metadata.other.published),
            tags: Array.isArray(post.metadata.other.tags) ? post.metadata.other.tags.map(String) : [],
          },
        ]
      : []
  );
  const years = [...new Set(posts.map((p) => p.published.slice(0, 4)))];

  return (
    <NavContentWrapper>
      <h1>Blog Posts</h1>
      <p className="mb-8 text-text-muted">
        Finished pieces, published once. For notes I keep editing, see <Link href="/research">Research</Link>.
      </p>

      {years.map((year) => (
        <section key={year} className="mb-8 max-w-3xl">
          <h2 className="mt-0! mb-1! border-0! font-mallory-book! text-xs! font-semibold tracking-wider text-text-muted uppercase">
            {year}
          </h2>
          <ul className="m-0 list-none! divide-y divide-black/10 border-y border-black/10 pl-0!">
            {posts
              .filter((p) => p.published.startsWith(year))
              .map((post) => (
                <li
                  key={post.slug}
                  className="flex flex-wrap items-baseline justify-between gap-x-4 py-2 font-mallory-book"
                >
                  <span>
                    <Link href={`/posts/${post.slug}`}>{post.title}</Link>{" "}
                    {post.tags.length > 0 && <span className="text-sm text-text-muted">{post.tags.join(", ")}</span>}
                  </span>
                  <span className="text-sm text-text-muted">
                    <Date dateString={post.published} />
                  </span>
                </li>
              ))}
          </ul>
        </section>
      ))}
    </NavContentWrapper>
  );
}

export default PostList;

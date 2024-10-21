import { GetPosts } from "@/lib/posts";

export default async function sitemap() {
  const posts = await GetPosts(true);

  const links = [
    {
      url: process.env.WEBSITE_URL,
      lastModified: new Date(),
    },
    ...posts.map((post) => {
      if (!post.metadata.other) return null;

      return {
        url: `${process.env.WEBSITE_URL}/posts/${post.metadata.other.slug}`,
        lastModified: post.metadata.other.published,
      };
    }),
  ];
  return links;
}

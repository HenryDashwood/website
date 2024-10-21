import { GetPosts } from "@/lib/posts";

export default async function sitemap() {
  const posts = await GetPosts(true);

  const links = [
    {
      url: process.env.WEBSITE_URL,
      lastModified: new Date(),
    },
    ...posts.map((post) => ({
      url: `${process.env.WEBSITE_URL}/posts/${post.metadata.slug}`,
      lastModified: post.metadata.published,
    })),
  ];
  return links;
}

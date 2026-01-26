import { GetPosts } from "@/lib/posts";
import { GetAllResearch } from "@/lib/research";

export default async function sitemap() {
  const posts = await GetPosts(true);
  const research = await GetAllResearch(false);

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
    ...research.map((item) => {
      return {
        url: `${process.env.WEBSITE_URL}/research/${item.slug}`,
        lastModified: item.metadata.other?.lastUpdated
          ? new Date(String(item.metadata.other.lastUpdated))
          : new Date(),
      };
    }),
  ];
  return links;
}

import { GetPosts } from "@/lib/posts";
import { getAllNotes, getAllTopics } from "@/lib/research";

export default async function sitemap() {
  const posts = await GetPosts(true);
  const [notes, topics] = await Promise.all([getAllNotes(), getAllTopics()]);

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
    ...[...notes, ...topics].map((item) => ({
      url: `${process.env.WEBSITE_URL}/research/${item.slug}`,
      lastModified: item.lastUpdated ? new Date(item.lastUpdated) : new Date(),
    })),
  ];
  return links;
}

import { GetPosts } from "@/lib/posts";
import RSS from "rss";

const feedOptions = {
  title: "Henry Dashwood",
  description: "The RSS feed of henrydashwood.com",
  feed_url: `${process.env.WEBSITE_URL}/feed.xml`,
  site_url: process.env.WEBSITE_URL || "",
  language: "en-uk",
};

export async function GET() {
  const feed = new RSS(feedOptions);

  const posts = await GetPosts(true);

  posts.forEach((post) => {
    if (!post.metadata.other) return;

    feed.item({
      title: String(post.metadata.title),
      description: post.content || "",
      url: `${process.env.WEBSITE_URL}/posts/${post.metadata.other.slug}`,
      date: String(post.metadata.other.published),
    });
  });

  return new Response(feed.xml({ indent: true }), {
    headers: {
      "Content-Type": "application/atom+xml; charset=utf-8",
    },
  });
}

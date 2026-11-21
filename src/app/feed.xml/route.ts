import RSS from "rss";

import { MdxToFeedHtml } from "@/lib/feedHtml";
import { GetPosts } from "@/lib/posts";

const siteUrl = (process.env.WEBSITE_URL || "").replace(/\/$/, "");

const feedOptions = {
  title: "Henry Dashwood",
  description: "The RSS feed of henrydashwood.com",
  feed_url: `${siteUrl}/feed.xml`,
  site_url: siteUrl,
  // Readers that show a feed as a show need artwork, and fall back to a
  // placeholder without it. Square, because that is the shape they all assume.
  image_url: `${siteUrl}/api/og?shape=square&title=Henry+Dashwood`,
  language: "en-gb",
};

export async function GET() {
  const posts = await GetPosts(true);
  const latestPublished = posts[0]?.metadata.other?.published;

  const feed = new RSS({
    ...feedOptions,
    ...(latestPublished ? { pubDate: String(latestPublished) } : {}),
  });

  for (const post of posts) {
    if (!post.metadata.other) continue;

    const postUrl = `${siteUrl}/posts/${post.metadata.other.slug}`;
    const htmlContent = post.content ? await MdxToFeedHtml(post.content, { siteUrl, postUrl }) : "";
    const summary = typeof post.metadata.description === "string" ? post.metadata.description.trim() : "";
    const categories = Array.isArray(post.metadata.other.tags) ? post.metadata.other.tags.map(String) : undefined;

    feed.item({
      title: String(post.metadata.title),
      description: summary || htmlContent,
      url: postUrl,
      date: String(post.metadata.other.published),
      author: "Henry Dashwood",
      categories,
      custom_elements: [{ "content:encoded": { _cdata: htmlContent } }],
    });
  }

  return new Response(feed.xml({ indent: true }), {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}

import { MdxToFeedHtml } from "@/lib/feedHtml";
import { GetPosts } from "@/lib/posts";
import RSS from "rss";

const siteUrl = (process.env.WEBSITE_URL || "").replace(/\/$/, "");

const feedOptions = {
  title: "Henry Dashwood",
  description: "The RSS feed of henrydashwood.com",
  feed_url: `${siteUrl}/feed.xml`,
  site_url: siteUrl,
  language: "en-uk",
};

export async function GET() {
  const feed = new RSS(feedOptions);

  const posts = await GetPosts(true);

  for (const post of posts) {
    if (!post.metadata.other) continue;

    const postUrl = `${siteUrl}/posts/${post.metadata.other.slug}`;
    const htmlDescription = post.content ? await MdxToFeedHtml(post.content, { siteUrl, postUrl }) : "";

    feed.item({
      title: String(post.metadata.title),
      description: htmlDescription,
      url: postUrl,
      date: String(post.metadata.other.published),
      custom_elements: [{ "content:encoded": { _cdata: htmlDescription } }],
    });
  }

  return new Response(feed.xml({ indent: true }), {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}

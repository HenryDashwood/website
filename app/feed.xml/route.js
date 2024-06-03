import RSS from "rss";

import { fetcher } from "../../lib/api";
import markdownToHTML from "../../lib/markdownToHTML";

export async function GET() {
  const { data } = await fetcher(
    `${process.env.NEXT_PUBLIC_STRAPI_URL}/posts?sort[0]=published:desc`
  );

  const feed = new RSS({
    title: "Henry Dashwood",
    description: "The RSS feed of henrydashwood.com",
    site_url: process.env.WEBSITE_URL,
    feed_url: `${process.env.WEBSITE_URL}/feed.xml`,
    copyright: `${new Date().getFullYear()} Henry Dashwood`,
    language: "en",
    pubDate: new Date(),
  });

  for (const post of data) {
    const htmlContent = await markdownToHTML(post.attributes.content);

    feed.item({
      title: post.attributes.title,
      pubDate: post.attributes.published,
      guid: `${process.env.WEBSITE_URL}/posts/${post.attributes.slug}`,
      url: `${process.env.WEBSITE_URL}/posts/${post.attributes.slug}`,
      description: htmlContent,
    });
  }

  return new Response(feed.xml({ indent: true }), {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}

import RSS from "rss";
import he from "he";

import { fetcher } from "../../lib/api";

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

  data.forEach((post) => {
    feed.item({
      title: post.attributes.title,
      url: `${process.env.WEBSITE_URL}/posts/${post.attributes.slug}`,
      date: post.attributes.published,
      description: he.encode(post.attributes.content),
    });
  });

  return new Response(feed.xml(), {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}

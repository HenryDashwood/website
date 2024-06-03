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
    image_url: `${process.env.WEBSITE_URL}/favicon.ico`,
    copyright: `${new Date().getFullYear()} Henry Dashwood`,
    language: "en",
    pubDate: new Date(),
  });

  for (const post of data) {
    const htmlContent = await markdownToHTML(post.attributes.content);

    feed.item({
      description: htmlContent,
      title: post.attributes.title,
      url: `${process.env.WEBSITE_URL}/posts/${post.attributes.slug}`,
      guid: `${process.env.WEBSITE_URL}/posts/${post.attributes.slug}`,
      author: "Henry Dashwood",
      date: post.attributes.published,
    });
  }

  return new Response(feed.xml({ indent: true }), {
    headers: {
      "Content-Type": "application/atom+xml; charset=utf-8",
    },
  });
}

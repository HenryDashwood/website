import { fetcher } from "../../lib/api";
import markdownToHTML from "../../lib/markdownToHTML";

export async function GET(request) {
  const { data } = await fetcher(
    `${process.env.NEXT_PUBLIC_STRAPI_URL}/posts?sort[0]=published:desc`
  );

  const feed = `<?xml version="1.0" encoding="UTF-8" ?>
    <rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
        <channel>
            <title>Henry Dashwood</title>
            <link>${process.env.WEBSITE_URL}</link>
            <description>The RSS feed of henrydashwood.com</description>
            <language>en-uk</language>
            <atom:link href="${
              process.env.WEBSITE_URL
            }/feed.xml" rel="self" type="application/rss+xml" />
            ${await Promise.all(
              data.map(async (post) => {
                const contentHTML = await markdownToHTML(
                  post.attributes.content
                );
                const pubDate = new Date(
                  post.attributes.published
                ).toUTCString();
                return `
              <item>
                <title>${post.attributes.title}</title>
                <link>${`${process.env.WEBSITE_URL}/posts/${post.attributes.slug}`}</link>
                <guid>${`${process.env.WEBSITE_URL}/posts/${post.attributes.slug}`}</guid>
                <pubDate>${pubDate}</pubDate>
                <content:encoded><![CDATA[${contentHTML}]]></content:encoded>
              </item>`;
              })
            ).then((items) => items.join(""))}
        </channel>
    </rss>`;

  return new Response(feed, {
    status: 200,
    headers: { "Content-Type": "application/rss+xml" },
  });
}

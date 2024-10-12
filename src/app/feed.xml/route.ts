interface Post {
  attributes: {
    title: string;
    content: string;
    published: string;
    slug: string;
    createdAt: string;
    updatedAt: string;
    publishedAt: string;
  };
}

export async function GET() {
  const postsData = await fetch(
    `${process.env.NEXT_PUBLIC_STRAPI_URL}/posts?sort[0]=published:desc`
  ).then((res) => res.json());

  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom" version="2.0">
  <channel>
    <title>Henry Dashwood</title>
    <link>${process.env.WEBSITE_URL}</link>
    <description>The RSS feed of henrydashwood.com</description>
    <language>en-uk</language>
    <atom:link href="${
      process.env.WEBSITE_URL
    }/feed.xml" rel="self" type="application/rss+xml" />
    ${await Promise.all(
      postsData.data.map(async (post: Post) => {
        let { content, _ } = await markdownToHTML(post.attributes.content);
        content = content.replace(/[^\x00-\x7F]/g, "").replace(/\n/g, "");
        const pubDate = new Date(post.attributes.published).toUTCString();
        return `
      <item>
        <title><![CDATA[${post.attributes.title}]]></title>
        <link>${`${process.env.WEBSITE_URL}/posts/${post.attributes.slug}`}</link>
        <guid>${`${process.env.WEBSITE_URL}/posts/${post.attributes.slug}`}</guid>
        <dc:creator><![CDATA[Henry Dashwood]]></dc:creator>
        <pubDate>${pubDate}</pubDate>
        <description><![CDATA[${post.attributes.content
          .slice(0, 100)
          .replace(/\n/g, " ")}...]]></description>
        <content:encoded><![CDATA[${content}]]></content:encoded>
      </item>`;
      })
    ).then((items) => items.join(""))}
  </channel>
</rss>`;

  return new Response(feed, {
    status: 200,
    headers: { "Content-Type": "application/xml" },
  });
}

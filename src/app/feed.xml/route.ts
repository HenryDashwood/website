import { GetPosts } from "@/lib/posts";
import RSS from "rss";
import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

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

  for (const post of posts) {
    if (!post.metadata.other) return;

    let htmlDescription = post.content ? await marked(post.content) : "";
    htmlDescription = htmlDescription.replace(/<Image([^>]*)>/gi, "<img$1/>");
    htmlDescription = htmlDescription.replace(/<image([^>]*)>/gi, "<img$1/>");

    htmlDescription = sanitizeHtml(htmlDescription, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img"]),
      allowedAttributes: {
        ...sanitizeHtml.defaults.allowedAttributes,
        img: ["src", "alt", "title", "width", "height"],
      },
    });

    htmlDescription = htmlDescription.replace(/\s+/g, " ").trim();

    feed.item({
      title: String(post.metadata.title),
      description: htmlDescription,
      url: `${process.env.WEBSITE_URL}/posts/${post.metadata.other.slug}`,
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

import { fetcher } from "../lib/api";

export default async function sitemap() {
  const { data } = await fetcher(
    `${process.env.NEXT_PUBLIC_STRAPI_URL}/posts?sort[0]=published:desc`
  );

  const posts = data.map((post) => ({
    url: `${process.env.WEBSITE_URL}/posts/${post.attributes.slug}`,
    lastModified: post.attributes.updatedAt,
  }));

  const links = [
    {
      url: process.env.WEBSITE_URL,
      lastModified: new Date(),
    },
    ...posts,
  ];
  return links;
}

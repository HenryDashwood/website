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

export default async function sitemap() {
  const postsData = await fetch(
    `${process.env.NEXT_PUBLIC_STRAPI_URL}/posts?sort[0]=published:desc`
  ).then((res) => res.json());

  const posts = postsData.data.map((post: Post) => ({
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

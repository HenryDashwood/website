import NavContentWrapper from "@/components/NavContentWrapper";
import { MDXRemote } from "next-mdx-remote/rsc";

export const revalidate = 3600;

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

export async function generateStaticParams() {
  const thingsData = await fetch(
    `${process.env.NEXT_PUBLIC_STRAPI_URL}/posts`
  ).then((res) => res.json());
  const output = thingsData.data.map((thing: Post) => ({
    slug: thing.attributes.slug.toString(),
  }));
  return output;
}

async function RemoteMdxPage({ params }: { params: { slug: string } }) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_STRAPI_URL}/posts?filters[slug][$eq]=${params.slug}&populate[0]=tags`
  ).then((res) => res.json());

  const markdown = res.data[0].attributes.content;
  return (
    <NavContentWrapper>
      <MDXRemote source={markdown} />
    </NavContentWrapper>
  );
}

export default RemoteMdxPage;

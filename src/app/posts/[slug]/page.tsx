import NavContentWrapper from "@/components/NavContentWrapper";
import DateComponent from "@/components/Date";
import MdxImage from "@/components/MdxImage";
import { MDXRemote } from "next-mdx-remote/rsc";

import { readFileSync } from "fs";
import matter from "gray-matter";

export const revalidate = 3600;

async function GetPost(params: { slug: string }) {
  const postFile = readFileSync(`posts/${params.slug}/post.mdx`, "utf8");
  const { data, content } = matter(postFile);
  return {
    data: data,
    content: content,
  };
}

const components = { MdxImage };

async function RemoteMdxPage({ params }: { params: { slug: string } }) {
  const { data, content } = await GetPost(params);

  if (content) {
    return (
      <NavContentWrapper>
        <h1>{data.title}</h1>
        <p>
          <DateComponent dateString={data.published.toISOString()} />
        </p>
        <MDXRemote source={content} components={components} />
      </NavContentWrapper>
    );
  }
}

export default RemoteMdxPage;

import NavContentWrapper from "@/components/NavContentWrapper";
import DateComponent from "@/components/Date";
import MdxImage from "@/components/MdxImage";
import { MDXRemote } from "next-mdx-remote/rsc";
import { GetPost } from "@/lib/posts";

export const revalidate = 3600;

const components = { MdxImage };

async function RemoteMdxPage({ params }: { params: { slug: string } }) {
  const post = await GetPost(params.slug, true);

  if (post.content) {
    return (
      <NavContentWrapper>
        <h1>{post.metadata.title}</h1>
        <p>
          <DateComponent dateString={post.metadata.published.toISOString()} />
        </p>
        <MDXRemote source={post.content} components={components} />
      </NavContentWrapper>
    );
  }
}

export default RemoteMdxPage;

import NavContentWrapper from "@/components/NavContentWrapper";
import Date from "@/components/Date";
import { PostMetadata } from "@/lib/posts";

export default async function Post({
  postMetadata,
}: {
  postMetadata: PostMetadata;
}) {
  const { default: Markdown } = await import(
    `@/app/posts/${postMetadata.slug}/post.mdx`
  );

  return (
    <NavContentWrapper>
      <h1>{postMetadata.title}</h1>
      <div className="text-[#666666]">
        <Date dateString={postMetadata.published} />
      </div>
      <Markdown />
      <div className="text-[#666666]">
        <p>Tags: {postMetadata.tags.join(", ")}</p>
      </div>
    </NavContentWrapper>
  );
}

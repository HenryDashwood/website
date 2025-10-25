import Date from "@/components/Date";
import NavContentWrapper from "@/components/NavContentWrapper";
import { Metadata } from "next";

export default async function Post({ metadata }: { metadata: Metadata }) {
  if (
    !metadata.title ||
    !metadata.other ||
    !metadata.other.slug ||
    !metadata.other.published ||
    !metadata.other.tags
  ) {
    throw new Error("Metadata is undefined");
  }

  const { default: Markdown } = await import(`@/app/posts/${metadata.other.slug}/post.mdx`);

  return (
    <NavContentWrapper>
      <h1>{String(metadata.title)}</h1>
      <div className="pb-4">
        <Date dateString={String(metadata.other.published)} />
      </div>
      <Markdown />
      <div className="text-[#666666] font-mallory-book">
        <p>Tags: {String(metadata.other.tags).split(",").join(", ")}</p>
      </div>
    </NavContentWrapper>
  );
}

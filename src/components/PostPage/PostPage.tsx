import NavContentWrapper from "@/components/NavContentWrapper";
import Date from "@/components/Date";
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

  const { default: Markdown } = await import(
    `@/app/posts/${metadata.other.slug}/post.mdx`
  );

  return (
    <NavContentWrapper>
      <h1>{String(metadata.title)}</h1>
      <div className="text-[#666666]">
        <Date dateString={String(metadata.other.published)} />
      </div>
      <Markdown />
      <div className="text-[#666666]">
        <p>Tags: {String(metadata.other.tags).split(",").join(", ")}</p>
      </div>
    </NavContentWrapper>
  );
}

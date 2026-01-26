import Date from "@/components/Date";
import NavContentWrapper from "@/components/NavContentWrapper";
import { Metadata } from "next";

interface ResearchPageProps {
  metadata: Metadata;
}

export default async function ResearchPage({ metadata }: ResearchPageProps) {
  if (!metadata.title || !metadata.other || !metadata.other.slug) {
    throw new Error("Research metadata is undefined");
  }

  const slug = String(metadata.other.slug);
  const { default: Markdown } = await import(`@/app/research/${slug}/content.mdx`);

  const lastUpdated = metadata.other.lastUpdated ? String(metadata.other.lastUpdated) : null;
  const created = metadata.other.created ? String(metadata.other.created) : null;
  const tags = metadata.other.tags ? String(metadata.other.tags) : null;

  return (
    <NavContentWrapper>
      <h1>{String(metadata.title)}</h1>

      <div className="font-mallory-book text-text-muted mb-6 text-sm">
        {lastUpdated && (
          <div className="flex items-center gap-2">
            <span>Last updated:</span>
            <Date dateString={lastUpdated} />
          </div>
        )}
        {created && (
          <div className="flex items-center gap-2">
            <span>Created:</span>
            <Date dateString={created} />
          </div>
        )}
      </div>

      <Markdown />

      {tags && (
        <div className="font-mallory-book text-text-muted mt-8 border-t pt-4">
          <p>Tags: {tags.split(",").join(", ")}</p>
        </div>
      )}
    </NavContentWrapper>
  );
}

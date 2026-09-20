import { Metadata } from "next";

import Date from "@/components/Date";
import NavContentWrapper from "@/components/NavContentWrapper";

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

      <div className="mb-6 font-mallory-book text-sm text-text-muted">
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
        <div className="mt-8 border-t pt-4 font-mallory-book text-text-muted">
          <p>Tags: {tags.split(",").join(", ")}</p>
        </div>
      )}
    </NavContentWrapper>
  );
}

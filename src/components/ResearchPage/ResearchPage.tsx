import Date from "@/components/Date";
import NavContentWrapper from "@/components/NavContentWrapper";
import { ResearchNote } from "@/lib/research";

export default async function ResearchPage({ note }: { note: ResearchNote }) {
  const { default: Markdown } = await import(`@/app/research/${note.slug}/content.mdx`);

  return (
    <NavContentWrapper>
      <h1>{note.title}</h1>

      <div className="mb-6 font-mallory-book text-sm text-text-muted">
        {note.lastUpdated && (
          <div className="flex items-center gap-2">
            <span>Last updated:</span>
            <Date dateString={note.lastUpdated} />
          </div>
        )}
        {note.created && (
          <div className="flex items-center gap-2">
            <span>Created:</span>
            <Date dateString={note.created} />
          </div>
        )}
      </div>

      <Markdown />

      {note.tags.length > 0 && (
        <div className="mt-8 border-t pt-4 font-mallory-book text-text-muted">
          <p>Tags: {note.tags.join(", ")}</p>
        </div>
      )}
    </NavContentWrapper>
  );
}

import type { Metadata } from "next";

import Date from "@/components/Date";
import ListRow from "@/components/ListRow";
import { TopicPath } from "@/components/ResearchNoteList";
import { getAllNotes } from "@/lib/research";

export const revalidate = 3600;

const RECENT_COUNT = 10;

export const metadata: Metadata = {
  title: "Research",
  description: "Ongoing research projects and notes",
  openGraph: {
    images: [
      {
        url: `${process.env.WEBSITE_URL}/api/og?title=Research`,
      },
    ],
  },
};

async function ResearchIndex() {
  const notes = await getAllNotes();

  return (
    <>
      <h1>Research</h1>
      <p className="mb-8 text-text-muted">
        Ongoing research projects and notes that evolve over time. Unlike blog posts, these get edited and extended as
        I learn more. Browse them all in the sidebar.
      </p>

      {notes.length === 0 ? (
        <p className="text-text-muted">No research notes yet.</p>
      ) : (
        <>
          <section className="max-w-3xl">
            <h2 className="mt-0! mb-1! border-0! font-mallory-book! text-xs! font-semibold tracking-wider text-text-muted uppercase">
              Recently updated
            </h2>
            <ul className="m-0 list-none! divide-y divide-black/10 border-y border-black/10 pl-0!">
              {notes.slice(0, RECENT_COUNT).map((note) => (
                <ListRow
                  key={note.slug}
                  href={`/research/${note.slug}`}
                  title={note.title}
                  meta={note.path.length > 1 ? <TopicPath note={note} /> : undefined}
                  date={note.lastUpdated ? <Date dateString={note.lastUpdated} /> : undefined}
                />
              ))}
            </ul>
          </section>
        </>
      )}
    </>
  );
}

export default ResearchIndex;

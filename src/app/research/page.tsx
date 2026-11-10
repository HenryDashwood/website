import type { Metadata } from "next";
import Link from "next/link";

import Date from "@/components/Date";
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
                <li
                  key={note.slug}
                  className="flex flex-wrap items-baseline justify-between gap-x-4 py-2 font-mallory-book"
                >
                  <span>
                    <Link href={`/research/${note.slug}`}>{note.title}</Link>{" "}
                    <span className="text-sm text-text-muted">
                      <TopicPath note={note} />
                    </span>
                  </span>
                  {note.lastUpdated && (
                    <span className="text-sm text-text-muted">
                      <Date dateString={note.lastUpdated} />
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </>
  );
}

export default ResearchIndex;

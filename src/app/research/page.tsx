import type { Metadata } from "next";
import Link from "next/link";

import Date from "@/components/Date";
import { TopicPath } from "@/components/ResearchNoteList";
import ResearchOutline from "@/components/ResearchOutline";
import { getAllNotes, getResearchNav } from "@/lib/research";

export const revalidate = 3600;

const RECENT_COUNT = 5;

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
  const [tree, notes] = await Promise.all([getResearchNav(), getAllNotes()]);

  return (
    <>
      <h1>Research</h1>
      <p className="mb-6 text-text-muted">
        Ongoing research projects and notes that evolve over time. Unlike blog posts, these get edited and extended as
        I learn more.
      </p>

      {notes.length === 0 ? (
        <p className="text-text-muted">No research notes yet.</p>
      ) : (
        <>
          <section className="mb-8 rounded-lg border border-black/10 bg-nav-background/10 px-4 py-3">
            <h2 className="mt-0! mb-2! border-0! font-mallory-book! text-xs! font-semibold tracking-wider text-black/60 uppercase">
              Recently updated
            </h2>
            <ul className="m-0 list-none! pl-0!">
              {notes.slice(0, RECENT_COUNT).map((note) => (
                <li
                  key={note.slug}
                  className="flex flex-wrap items-baseline justify-between gap-x-4 py-1 font-mallory-book text-sm"
                >
                  <span>
                    <Link href={`/research/${note.slug}`}>{note.title}</Link>{" "}
                    <span className="text-text-muted">
                      <TopicPath note={note} />
                    </span>
                  </span>
                  {note.lastUpdated && (
                    <span className="text-xs text-text-muted">
                      <Date dateString={note.lastUpdated} />
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <ResearchOutline nodes={tree} />
        </>
      )}
    </>
  );
}

export default ResearchIndex;

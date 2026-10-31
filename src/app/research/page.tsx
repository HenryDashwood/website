import type { Metadata } from "next";
import Link from "next/link";

import NavContentWrapper from "@/components/NavContentWrapper";
import ResearchNoteList from "@/components/ResearchNoteList";
import { getAllNotes, getResearchRoot, ResearchTopic } from "@/lib/research";

export const revalidate = 3600;

const RECENT_COUNT = 6;

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

function noteCount(n: number) {
  return `${n} ${n === 1 ? "note" : "notes"}`;
}

function TopicBlock({ topic }: { topic: ResearchTopic }) {
  return (
    <section className="rounded-lg border border-black/10 p-4 sm:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
        <h3 className="my-0">
          <Link href={`/research/${topic.slug}`}>{topic.title}</Link>
        </h3>
        <span className="font-mallory-book text-sm text-text-muted">{noteCount(topic.noteCount)}</span>
      </div>

      {topic.topics.length > 0 && (
        <ul className="mt-3 flex list-none! flex-wrap gap-2 pl-0!">
          {topic.topics.map((sub) => (
            <li key={sub.slug}>
              <Link
                href={`/research/${sub.slug}`}
                className="inline-block rounded-full bg-nav-background/25 px-3 py-1 font-mallory-book text-sm text-foreground! hover:bg-nav-background/45 hover:no-underline!"
              >
                {sub.title} <span className="text-text-muted">{sub.noteCount}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {topic.notes.length > 0 && (
        <ul className="mt-3 mb-0 list-none! columns-1 pl-0! sm:columns-2">
          {topic.notes.map((note) => (
            <li key={note.slug} className="break-inside-avoid py-1">
              <Link href={`/research/${note.slug}`}>{note.title}</Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

async function ResearchIndex() {
  const [root, notes] = await Promise.all([getResearchRoot(), getAllNotes()]);

  return (
    <NavContentWrapper>
      <h1>Research</h1>
      <p className="mb-6 text-text-muted">
        Ongoing research projects and notes that evolve over time. Unlike blog posts, these get edited and extended as
        I learn more.
      </p>

      {notes.length === 0 ? (
        <p className="text-text-muted">No research notes yet.</p>
      ) : (
        <>
          <h2>Recently updated</h2>
          <ResearchNoteList notes={notes.slice(0, RECENT_COUNT)} showTopic />

          <h2 className="mt-10">Topics</h2>
          <div className="flex flex-col gap-4">
            {root.topics.map((topic) => (
              <TopicBlock key={topic.slug} topic={topic} />
            ))}
            {root.notes.length > 0 && (
              <section className="rounded-lg border border-black/10 p-4 sm:p-5">
                <h3 className="my-0">Other notes</h3>
                <ResearchNoteList notes={root.notes} />
              </section>
            )}
          </div>
        </>
      )}
    </NavContentWrapper>
  );
}

export default ResearchIndex;

import type { Metadata } from "next";
import Link from "next/link";

import Date from "@/components/Date";
import NavContentWrapper from "@/components/NavContentWrapper";
import { getResearchRoot, ResearchTopic } from "@/lib/research";

import Changelog from "./changelog.mdx";

export const revalidate = 3600;

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

function TopicTree({ topic, depth = 0 }: { topic: ResearchTopic; depth?: number }) {
  return (
    <div className={depth > 0 ? "ml-4 border-l border-gray-200 pl-4" : ""}>
      {depth > 0 && (
        <div className="py-2">
          <Link href={`/research/${topic.slug}`} className="font-semibold">
            {topic.title}
          </Link>
        </div>
      )}
      {topic.topics.map((sub) => (
        <TopicTree key={sub.slug} topic={sub} depth={depth + 1} />
      ))}
      {topic.notes.map((note) => (
        <div key={note.slug} className={depth > 0 ? "ml-4 py-2" : "py-2"}>
          <Link href={`/research/${note.slug}`} className="font-medium hover:underline">
            {note.title}
          </Link>
          {note.lastUpdated && (
            <div className="font-mallory-book text-sm text-text-muted">
              Updated: <Date dateString={note.lastUpdated} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ChangelogSection() {
  return (
    <div className="mt-8">
      <h2>Changelog</h2>
      <Changelog />
    </div>
  );
}

async function ResearchList() {
  const root = await getResearchRoot();

  if (root.noteCount === 0) {
    return (
      <NavContentWrapper>
        <h1>Research</h1>
        <p className="text-text-muted">No research projects yet.</p>
      </NavContentWrapper>
    );
  }

  return (
    <NavContentWrapper>
      <h1>Research</h1>
      <p className="mb-6 text-text-muted">Ongoing research projects and notes that evolve over time.</p>
      <div className="space-y-2">
        <TopicTree topic={root} />
      </div>
      <ChangelogSection />
    </NavContentWrapper>
  );
}

export default ResearchList;

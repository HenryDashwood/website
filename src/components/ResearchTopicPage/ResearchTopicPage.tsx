import Link from "next/link";

import Date from "@/components/Date";
import NavContentWrapper from "@/components/NavContentWrapper";
import ResearchBreadcrumbs from "@/components/ResearchBreadcrumbs";
import ResearchNoteList from "@/components/ResearchNoteList";
import { ResearchTopic } from "@/lib/research";

function byRecency(a: { lastUpdated: string | null }, b: { lastUpdated: string | null }) {
  return (b.lastUpdated ?? "").localeCompare(a.lastUpdated ?? "");
}

export default function ResearchTopicPage({ topic }: { topic: ResearchTopic }) {
  return (
    <NavContentWrapper>
      <ResearchBreadcrumbs path={topic.path.slice(0, -1)} />
      <h1>{topic.title}</h1>
      <p className="-mt-2 font-mallory-book text-sm text-text-muted">
        {topic.noteCount} {topic.noteCount === 1 ? "note" : "notes"}
        {topic.lastUpdated && (
          <>
            {" "}
            · updated <Date dateString={topic.lastUpdated} />
          </>
        )}
      </p>

      {topic.topics.length > 0 && (
        <ul className="mt-6 grid list-none! grid-cols-1 gap-3 pl-0! sm:grid-cols-2">
          {topic.topics.map((sub) => (
            <li key={sub.slug}>
              <Link
                href={`/research/${sub.slug}`}
                className="block rounded-lg border border-black/10 p-4 hover:border-nav-background hover:no-underline!"
              >
                <span className="block text-lg">{sub.title}</span>
                <span className="font-mallory-book text-sm text-text-muted">
                  {sub.noteCount} {sub.noteCount === 1 ? "note" : "notes"}
                  {sub.lastUpdated && (
                    <>
                      {" "}
                      · updated <Date dateString={sub.lastUpdated} />
                    </>
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {topic.notes.length > 0 && (
        <div className="mt-6">
          <ResearchNoteList notes={topic.notes.toSorted(byRecency)} />
        </div>
      )}
    </NavContentWrapper>
  );
}

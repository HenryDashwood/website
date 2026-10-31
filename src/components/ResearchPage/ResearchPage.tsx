import Link from "next/link";

import Date from "@/components/Date";
import NavContentWrapper from "@/components/NavContentWrapper";
import ResearchBreadcrumbs from "@/components/ResearchBreadcrumbs";
import ResearchNoteList, { NoteMeta } from "@/components/ResearchNoteList";
import {
  getBacklinks,
  getChildNotes,
  getHeadings,
  getParentTopic,
  ResearchHeading,
  ResearchNote,
  ResearchTopic,
} from "@/lib/research";

function RailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="font-mallory-book text-sm">
      <h2 className="mt-0! mb-2! border-0! font-mallory-book! text-xs! font-semibold tracking-wider text-black/60 uppercase">
        {title}
      </h2>
      {children}
    </section>
  );
}

function InThisTopic({ note, topic }: { note: ResearchNote; topic: ResearchTopic }) {
  if (topic.notes.length < 2) return null;
  const topicHref = topic.slug ? `/research/${topic.slug}` : "/research";

  return (
    <RailSection title={topic.slug ? `In ${topic.title}` : "Other notes"}>
      <ul className="m-0 list-none! pl-0!">
        {topic.notes.map((sibling) => {
          const current = sibling.slug === note.slug;
          return (
            <li key={sibling.slug}>
              <Link
                href={`/research/${sibling.slug}`}
                aria-current={current ? "page" : undefined}
                className={`-mx-2 block rounded-md px-2 py-1.5 leading-snug ${
                  current ? "bg-nav-background/30 font-bold text-foreground!" : ""
                }`}
              >
                {sibling.title}
              </Link>
            </li>
          );
        })}
      </ul>
      <Link href={topicHref} className="mt-2 inline-block text-text-muted!">
        All of {topic.slug ? topic.title : "Research"} →
      </Link>
    </RailSection>
  );
}

function OnThisPage({ headings }: { headings: ResearchHeading[] }) {
  if (headings.length < 2) return null;
  return (
    <RailSection title="On this page">
      <ul className="m-0 list-none! pl-0!">
        {headings.map((heading) => (
          <li key={heading.id} className={heading.depth === 3 ? "pl-3" : ""}>
            <a href={`#${heading.id}`} className="block py-1 leading-snug text-text-muted! hover:text-foreground!">
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </RailSection>
  );
}

export default async function ResearchPage({ note }: { note: ResearchNote }) {
  const [{ default: Markdown }, topic, backlinks, children] = await Promise.all([
    import(`@/app/research/${note.slug}/content.mdx`),
    getParentTopic(note),
    getBacklinks(note.slug),
    getChildNotes(note.slug),
  ]);
  const headings = getHeadings(note.slug);

  return (
    <NavContentWrapper>
      <div className="max-w-none! xl:grid xl:grid-cols-[minmax(0,800px)_220px] xl:justify-center xl:gap-12">
        <article className="min-w-0">
          <ResearchBreadcrumbs path={note.path.slice(0, -1)} />
          <h1>{note.title}</h1>
          <div className="mb-6">
            <NoteMeta note={note} showCreated />
          </div>

          <Markdown />

          {children.length > 0 && (
            <section className="mt-10">
              <h2>Notes inside this one</h2>
              <ResearchNoteList notes={children} />
            </section>
          )}

          {(backlinks.length > 0 || note.log.length > 0) && (
            <div className="mt-12 grid gap-6 border-t-2 border-nav-background pt-6 sm:grid-cols-2">
              {backlinks.length > 0 && (
                <RailSection title="Linked from">
                  <ul className="m-0 list-none! pl-0!">
                    {backlinks.map((source) => (
                      <li key={source.slug} className="py-1">
                        <Link href={`/research/${source.slug}`}>{source.title}</Link>
                      </li>
                    ))}
                  </ul>
                </RailSection>
              )}
              {note.log.length > 0 && (
                <RailSection title="Revision log">
                  <ol className="m-0 list-none! pl-0!">
                    {note.log.map((entry) => (
                      <li key={`${entry.date}-${entry.note}`} className="py-1">
                        <Date dateString={entry.date} />
                        <span className="block text-foreground">{entry.note}</span>
                      </li>
                    ))}
                  </ol>
                </RailSection>
              )}
            </div>
          )}

          {note.tags.length > 0 && (
            <p className="mt-6 font-mallory-book text-sm text-text-muted">Tags: {note.tags.join(", ")}</p>
          )}

          {topic && (
            <div className="mt-10 xl:hidden">
              <InThisTopic note={note} topic={topic} />
            </div>
          )}
        </article>

        <aside className="hidden xl:block">
          <div className="sticky top-8 flex max-h-[calc(100vh-4rem)] flex-col gap-8 overflow-y-auto pt-16 pb-8">
            {topic && <InThisTopic note={note} topic={topic} />}
            <OnThisPage headings={headings} />
          </div>
        </aside>
      </div>
    </NavContentWrapper>
  );
}

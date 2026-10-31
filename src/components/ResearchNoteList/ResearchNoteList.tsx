import Link from "next/link";

import Date from "@/components/Date";
import { humaniseSegment, ResearchNote, ResearchStatus } from "@/lib/research";

const STATUS_STYLES: Record<ResearchStatus, string> = {
  seedling: "bg-emerald-100 text-emerald-900",
  growing: "bg-amber-100 text-amber-900",
  settled: "bg-sky-100 text-sky-900",
};

export function StatusLabel({ status }: { status: ResearchStatus }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 font-mallory-book text-xs tracking-wide uppercase ${STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  );
}

/** "AI / Questions" for a note's parent folders */
export function TopicPath({ note }: { note: ResearchNote }) {
  const parents = note.path.slice(0, -1);
  if (parents.length === 0) return null;
  return <span>{parents.map(humaniseSegment).join(" / ")}</span>;
}

/** Status · Updated date · Started date */
export function NoteMeta({ note, showCreated = false }: { note: ResearchNote; showCreated?: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mallory-book text-sm text-text-muted">
      {note.status && <StatusLabel status={note.status} />}
      {note.lastUpdated && (
        <span>
          Updated <Date dateString={note.lastUpdated} />
        </span>
      )}
      {showCreated && note.created && note.created !== note.lastUpdated && (
        <>
          <span aria-hidden="true">·</span>
          <span>
            Started <Date dateString={note.created} />
          </span>
        </>
      )}
    </div>
  );
}

interface ResearchNoteListProps {
  notes: ResearchNote[];
  /** Show which topic each note belongs to (for lists that mix topics) */
  showTopic?: boolean;
}

/** A list of notes with their date, status and either their latest log entry or description. */
export default function ResearchNoteList({ notes, showTopic = false }: ResearchNoteListProps) {
  return (
    <ul className="m-0 list-none! divide-y divide-black/10 pl-0!">
      {notes.map((note) => {
        const summary = note.log[0]?.note ?? note.description;
        return (
          <li key={note.slug} className="py-3">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4">
              <Link href={`/research/${note.slug}`} className="text-lg">
                {note.title}
              </Link>
              {note.lastUpdated && (
                <span className="shrink-0 font-mallory-book text-sm text-text-muted">
                  <Date dateString={note.lastUpdated} />
                </span>
              )}
            </div>
            {(showTopic || note.status || summary) && (
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 font-mallory-book text-sm text-text-muted">
                {note.status && <StatusLabel status={note.status} />}
                {showTopic && <TopicPath note={note} />}
                {showTopic && summary && note.path.length > 1 && <span aria-hidden="true">·</span>}
                {summary && <span>{summary}</span>}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

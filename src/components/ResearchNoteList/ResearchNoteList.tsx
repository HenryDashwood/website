import Link from "next/link";

import Date from "@/components/Date";
import { humaniseSegment, ResearchNote } from "@/lib/research";

/** "AI / Questions" for a note's parent folders */
export function TopicPath({ note }: { note: ResearchNote }) {
  const parents = note.path.slice(0, -1);
  if (parents.length === 0) return null;
  return <span>{parents.map(humaniseSegment).join(" / ")}</span>;
}

/** Updated date · Started date */
export function NoteMeta({ note, showCreated = false }: { note: ResearchNote; showCreated?: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mallory-book text-sm text-text-muted">
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

/** A list of notes with their date and either their latest log entry or description. */
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
            {(showTopic || summary) && (
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 font-mallory-book text-sm text-text-muted">
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

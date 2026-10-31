import Link from "next/link";

import Date from "@/components/Date";
import NavContentWrapper from "@/components/NavContentWrapper";
import { ResearchTopic } from "@/lib/research";

export default async function ResearchTopicPage({ topic }: { topic: ResearchTopic }) {
  return (
    <NavContentWrapper>
      <h1>{topic.title}</h1>

      {topic.topics.length > 0 && (
        <ul>
          {topic.topics.map((sub) => (
            <li key={sub.slug}>
              <Link href={`/research/${sub.slug}`}>{sub.title}</Link> ({sub.noteCount})
            </li>
          ))}
        </ul>
      )}

      <ul>
        {topic.notes.map((note) => (
          <li key={note.slug}>
            <Link href={`/research/${note.slug}`}>{note.title}</Link>
            {note.lastUpdated && (
              <>
                {" "}
                <Date dateString={note.lastUpdated} />
              </>
            )}
          </li>
        ))}
      </ul>
    </NavContentWrapper>
  );
}

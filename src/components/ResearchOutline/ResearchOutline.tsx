import Link from "next/link";

import Date from "@/components/Date";
import type { ResearchNavNode } from "@/lib/research";

function NoteRow({ node }: { node: ResearchNavNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 py-1">
      <Link href={`/research/${node.slug}`}>{node.title}</Link>
      {node.lastUpdated && (
        <span className="shrink-0 font-mallory-book text-xs text-text-muted">
          <Date dateString={node.lastUpdated} />
        </span>
      )}
    </div>
  );
}

function OutlineNodes({ nodes, depth }: { nodes: ResearchNavNode[]; depth: number }) {
  return (
    <ul className={`m-0 list-none! ${depth > 0 ? "ml-1.5 border-l border-black/15 pl-4!" : "pl-0!"}`}>
      {nodes.map((node) => (
        <li key={node.slug}>
          {node.kind === "folder" ? (
            <details open>
              <summary className="flex cursor-pointer list-none items-baseline gap-2 py-1.5 select-none">
                <span className={`font-semibold ${depth === 0 ? "font-arizona-flare text-2xl" : "text-lg"}`}>
                  {node.title}
                </span>
                <span className="font-mallory-book text-sm text-text-muted">
                  {node.count} {node.count === 1 ? "note" : "notes"}
                </span>
                <Link
                  href={`/research/${node.slug}`}
                  className="font-mallory-book text-xs text-text-muted! hover:text-foreground!"
                >
                  open →
                </Link>
              </summary>
              <OutlineNodes nodes={node.children} depth={depth + 1} />
            </details>
          ) : (
            <>
              <NoteRow node={node} />
              {node.children.length > 0 && <OutlineNodes nodes={node.children} depth={depth + 1} />}
            </>
          )}
        </li>
      ))}
    </ul>
  );
}

/** Every folder and note beneath a point in the hierarchy, open by default, each folder collapsible. */
export default function ResearchOutline({ nodes }: { nodes: ResearchNavNode[] }) {
  return (
    <div className="research-outline">
      <OutlineNodes nodes={nodes} depth={0} />
    </div>
  );
}

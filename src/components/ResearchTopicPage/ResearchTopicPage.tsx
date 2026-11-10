import Date from "@/components/Date";
import ResearchBreadcrumbs from "@/components/ResearchBreadcrumbs";
import ResearchOutline from "@/components/ResearchOutline";
import { ResearchNavNode } from "@/lib/research";

export default function ResearchTopicPage({ node }: { node: ResearchNavNode }) {
  const path = node.slug.split("/");

  return (
    <>
      <h1>{node.title}</h1>
      <div className="-mt-2 mb-6 flex flex-wrap items-center gap-x-2 font-mallory-book text-sm text-text-muted">
        <ResearchBreadcrumbs path={path.slice(0, -1)} />
        <span aria-hidden="true">·</span>
        <span>
          {node.count} {node.count === 1 ? "note" : "notes"}
          {node.lastUpdated && (
            <>
              {" "}
              · updated <Date dateString={node.lastUpdated} />
            </>
          )}
        </span>
      </div>

      <ResearchOutline nodes={node.children} />
    </>
  );
}

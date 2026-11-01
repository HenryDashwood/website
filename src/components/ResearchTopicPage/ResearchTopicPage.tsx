import Date from "@/components/Date";
import ResearchBreadcrumbs from "@/components/ResearchBreadcrumbs";
import ResearchOutline from "@/components/ResearchOutline";
import { ResearchNavNode } from "@/lib/research";

export default function ResearchTopicPage({ node }: { node: ResearchNavNode }) {
  const path = node.slug.split("/");

  return (
    <>
      <ResearchBreadcrumbs path={path.slice(0, -1)} />
      <h1>{node.title}</h1>
      <p className="-mt-2 mb-6 font-mallory-book text-sm text-text-muted">
        {node.count} {node.count === 1 ? "note" : "notes"}
        {node.lastUpdated && (
          <>
            {" "}
            · updated <Date dateString={node.lastUpdated} />
          </>
        )}
      </p>

      <ResearchOutline nodes={node.children} />
    </>
  );
}

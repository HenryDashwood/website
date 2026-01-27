import Date from "@/components/Date";
import NavContentWrapper from "@/components/NavContentWrapper";
import { GetResearchTree, ResearchTreeNode } from "@/lib/research";
import type { Metadata } from "next";
import Link from "next/link";
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

function TreeNode({ node, depth = 0 }: { node: ResearchTreeNode; depth?: number }) {
  const hasChildren = node.children.length > 0;
  const isPage = node.slug !== null;
  const displayName =
    node.title ||
    node.name
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  return (
    <div className={depth > 0 ? "ml-4 border-l border-gray-200 pl-4" : ""}>
      <div className="py-2">
        {isPage ? (
          <div className="flex flex-col gap-1">
            <Link href={`/research/${node.slug}`} className="font-medium hover:underline">
              {displayName}
            </Link>
            {node.lastUpdated && (
              <div className="font-mallory-book text-text-muted text-sm">
                Updated: <Date dateString={node.lastUpdated} />
              </div>
            )}
          </div>
        ) : (
          <span className="font-semibold text-gray-700">{displayName}</span>
        )}
      </div>

      {hasChildren && (
        <div>
          {node.children.map((child) => (
            <TreeNode key={child.name} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
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
  const tree = await GetResearchTree();

  if (tree.length === 0) {
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
      <p className="text-text-muted mb-6">Ongoing research projects and notes that evolve over time.</p>
      <div className="space-y-2">
        {tree.map((node) => (
          <TreeNode key={node.name} node={node} />
        ))}
      </div>
      <ChangelogSection />
    </NavContentWrapper>
  );
}

export default ResearchList;

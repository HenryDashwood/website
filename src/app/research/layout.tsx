import React from "react";

import Content from "@/components/Content";
import Nav from "@/components/Nav";
import ResearchTree, { ResearchBrowse } from "@/components/ResearchTree";
import { getAllNotes, getResearchNav } from "@/lib/research";

/**
 * Research pages share one layout so the tree keeps its open folders while you move between notes.
 * Pages inside it render their content only (no NavContentWrapper).
 */
export default async function ResearchLayout({ children }: { children: React.ReactNode }) {
  const [tree, notes] = await Promise.all([getResearchNav(), getAllNotes()]);

  return (
    <div className="flex min-h-screen flex-col sm:h-full sm:flex-row">
      <Nav />
      <ResearchTree tree={tree} />
      <Content>
        <ResearchBrowse tree={tree} count={notes.length} />
        {children}
      </Content>
    </div>
  );
}

import React from "react";

import Content from "@/components/Content";
import Nav from "@/components/Nav";

/**
 * Research pages share one layout so the sidebar keeps its open folders while you move between notes.
 * Pages inside it render their content only (no NavContentWrapper).
 */
export default function ResearchLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col sm:h-full sm:flex-row">
      <Nav />
      <Content>{children}</Content>
    </div>
  );
}

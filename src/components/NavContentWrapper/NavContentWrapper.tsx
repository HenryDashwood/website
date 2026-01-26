import Content from "@/components/Content";
import Nav from "@/components/Nav";
import { GetResearchTree } from "@/lib/research";
import React from "react";

const NavContentWrapper = async ({ children }: { children: React.ReactNode }) => {
  const researchTree = await GetResearchTree();

  return (
    <div className="flex min-h-screen flex-col sm:h-full sm:flex-row">
      <Nav researchTree={researchTree} />
      <Content>{children}</Content>
    </div>
  );
};

export default NavContentWrapper;

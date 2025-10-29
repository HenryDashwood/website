import Content from "@/components/Content";
import Nav from "@/components/Nav";
import React from "react";

const NavContentWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex min-h-screen flex-col sm:h-full sm:flex-row">
      <Nav />
      <Content>{children}</Content>
    </div>
  );
};

export default NavContentWrapper;

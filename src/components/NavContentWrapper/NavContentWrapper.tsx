import React from "react";
import Nav from "@/components/Nav";
import Content from "@/components/Content";

const NavContentWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:h-full min-h-screen">
      <Nav />
      <Content>{children}</Content>
    </div>
  );
};

export default NavContentWrapper;

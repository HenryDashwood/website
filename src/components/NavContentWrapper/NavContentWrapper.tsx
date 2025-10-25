import Content from "@/components/Content";
import Nav from "@/components/Nav";
import React from "react";

const NavContentWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:h-full min-h-screen">
      <Nav />
      <Content>{children}</Content>
    </div>
  );
};

export default NavContentWrapper;

import React from "react";
import Nav from "@/components/Nav";
import Content from "@/components/Content";

const NavContentWrapper = ({ children }) => {
  return (
    <div className="sm:flex sm:flex-row sm:h-screen">
      <Nav />
      <Content>{children}</Content>
    </div>
  );
};

export default NavContentWrapper;

import React from "react";

const TableWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="w-full overflow-x-auto [-webkit-overflow-scrolling:touch] md:overflow-x-visible">
      <table>{children}</table>
    </div>
  );
};

export default TableWrapper;

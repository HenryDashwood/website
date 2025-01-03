import React from "react";

const Content = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex flex-grow justify-center items-start h-full px-4 md:px-8 lg:px-8">
      <div className="max-w-[800px] w-full flex flex-col rounded-lg mt-4 mb-4">
        <div className="w-full">{children}</div>
      </div>
    </div>
  );
};

export default Content;

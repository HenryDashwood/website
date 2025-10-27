import React from "react";

const Content = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex grow justify-center items-start h-full px-2 sm:px-4 md:px-8 lg:px-8 overflow-x-hidden">
      <div className="w-full flex flex-col rounded-lg mt-4 mb-4">
        <div className="w-full prose-content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Content;

import React from "react";

const Content = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex h-full grow items-start justify-center overflow-x-hidden px-2 pt-16 sm:px-4 sm:pt-4 md:px-8 lg:px-8">
      <div className="mt-4 mb-4 flex w-full flex-col rounded-lg">
        <div className="prose-content w-full">{children}</div>
      </div>
    </div>
  );
};

export default Content;

import Link from "next/link";
import React from "react";

interface ListRowProps {
  href: string;
  title: string;
  /** Muted context after the title, e.g. tags or a topic path */
  meta?: React.ReactNode;
  date?: React.ReactNode;
}

/**
 * One row of a hairline list. Wide screens: title and meta on the left, date on the right.
 * Narrow screens: the title on its own line, with meta · date in a muted line beneath, so rows never wrap raggedly.
 */
export default function ListRow({ href, title, meta, date }: ListRowProps) {
  const hasMeta = meta !== undefined && meta !== null && meta !== "";
  return (
    <li className="py-2 font-mallory-book lg:flex lg:items-baseline lg:justify-between lg:gap-x-4">
      <div>
        <Link href={href}>{title}</Link>
        {hasMeta && <span className="hidden text-sm text-text-muted lg:inline"> {meta}</span>}
      </div>
      <div className="mt-0.5 text-sm text-text-muted lg:mt-0 lg:shrink-0">
        {hasMeta && (
          <span className="lg:hidden">
            {meta}
            {date && <span aria-hidden="true"> · </span>}
          </span>
        )}
        {date}
      </div>
    </li>
  );
}

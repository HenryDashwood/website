import Link from "next/link";

import { humaniseSegment } from "@/lib/research";

/** Research / AI / Questions, each linking to its topic page. `path` is the parent path of the current page. */
export default function ResearchBreadcrumbs({ path }: { path: string[] }) {
  const crumbs = [
    { href: "/research", label: "Research" },
    ...path.map((segment, i) => ({
      href: `/research/${path.slice(0, i + 1).join("/")}`,
      label: humaniseSegment(segment),
    })),
  ];

  return (
    <nav aria-label="Breadcrumb" className="mt-4 -mb-2 font-mallory-book text-sm text-text-muted">
      {crumbs.map((crumb, i) => (
        <span key={crumb.href}>
          {i > 0 && <span className="mx-1.5 opacity-60">/</span>}
          <Link href={crumb.href} className="text-text-muted! hover:text-foreground!">
            {crumb.label}
          </Link>
        </span>
      ))}
    </nav>
  );
}

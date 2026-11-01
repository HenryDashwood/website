"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import type { ResearchNavNode } from "@/lib/research";

const INDENT = 14;

/** Slug of the current research page, e.g. "AI/questions/cuda-kernels", or "" on the index */
function currentSlug(pathname: string | null) {
  if (!pathname?.startsWith("/research")) return null;
  return decodeURIComponent(pathname.replace(/^\/research\/?/, "").replace(/\/+$/, ""));
}

/** "a/b/c" -> ["a", "a/b"] (the folders above it), plus the slug itself */
function selfAndAncestors(slug: string) {
  const parts = slug.split("/").filter(Boolean);
  return parts.map((_, i) => parts.slice(0, i + 1).join("/"));
}

function allFolderSlugs(nodes: ResearchNavNode[]): string[] {
  return nodes.flatMap((n) => (n.children.length > 0 ? [n.slug, ...allFolderSlugs(n.children)] : []));
}

/** Keep nodes whose title matches, or that have a matching descendant */
function filterTree(nodes: ResearchNavNode[], query: string): ResearchNavNode[] {
  return nodes.flatMap((node) => {
    const children = filterTree(node.children, query);
    if (node.title.toLowerCase().includes(query) || children.length > 0) {
      return [{ ...node, children }];
    }
    return [];
  });
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-3 w-3 shrink-0 transition-transform ${open ? "rotate-90" : ""}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
    </svg>
  );
}

interface TreeProps {
  nodes: ResearchNavNode[];
  depth: number;
  current: string | null;
  isOpen: (slug: string) => boolean;
  toggle: (slug: string) => void;
  onNavigate?: () => void;
}

function TreeNodes({ nodes, depth, current, isOpen, toggle, onNavigate }: TreeProps) {
  return (
    <ul className="m-0 list-none! pl-0!" role={depth === 0 ? "tree" : "group"}>
      {nodes.map((node) => {
        const hasChildren = node.children.length > 0;
        const open = hasChildren && isOpen(node.slug);
        const active = node.slug === current;
        const pad = { paddingLeft: `${8 + depth * INDENT}px` };

        return (
          <li key={node.slug} role="treeitem" aria-expanded={hasChildren ? open : undefined}>
            {node.kind === "folder" ? (
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => toggle(node.slug)}
                  className="flex flex-1 items-center gap-1.5 rounded-md py-1.5 pr-2 text-left font-semibold text-foreground"
                  style={pad}
                >
                  <Chevron open={open} />
                  <span className="flex-1">{node.title}</span>
                  <span className="text-xs font-normal text-text-muted">{node.count}</span>
                </button>
              </div>
            ) : (
              <div className="flex items-start">
                {hasChildren && (
                  <button
                    type="button"
                    onClick={() => toggle(node.slug)}
                    aria-label={open ? `Collapse ${node.title}` : `Expand ${node.title}`}
                    className="mt-1 shrink-0 rounded-md p-1 text-foreground"
                    style={{ marginLeft: `${4 + depth * INDENT}px` }}
                  >
                    <Chevron open={open} />
                  </button>
                )}
                <Link
                  href={`/research/${node.slug}`}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={`flex-1 rounded-md py-1.5 pr-2 leading-snug ${
                    active ? "font-bold underline!" : "hover:underline!"
                  }`}
                  style={hasChildren ? { paddingLeft: "4px" } : { paddingLeft: `${8 + depth * INDENT + 18}px` }}
                >
                  {node.title}
                </Link>
              </div>
            )}

            {open && (
              <TreeNodes
                nodes={node.children}
                depth={depth + 1}
                current={current}
                isOpen={isOpen}
                toggle={toggle}
                onNavigate={onNavigate}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}

function useResearchTree(tree: ResearchNavNode[]) {
  const pathname = usePathname();
  const current = currentSlug(pathname);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(current ? selfAndAncestors(current) : []));
  const [query, setQuery] = useState("");

  // Open the folders above the current page whenever it changes
  const [openedFor, setOpenedFor] = useState(current);
  if (current !== openedFor) {
    setOpenedFor(current);
    if (current) setExpanded((prev) => new Set([...prev, ...selfAndAncestors(current)]));
  }

  const trimmed = query.trim().toLowerCase();
  const visible = useMemo(() => (trimmed ? filterTree(tree, trimmed) : tree), [tree, trimmed]);

  const toggle = (slug: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });

  return {
    current,
    visible,
    query,
    setQuery,
    filtering: trimmed !== "",
    isOpen: (slug: string) => trimmed !== "" || expanded.has(slug),
    toggle,
    expandAll: () => setExpanded(new Set(allFolderSlugs(tree))),
    collapseAll: () => setExpanded(new Set()),
  };
}

function TreePanel({ tree, onNavigate }: { tree: ResearchNavNode[]; onNavigate?: () => void }) {
  const state = useResearchTree(tree);

  return (
    <div className="font-mallory-book text-sm">
      <div className="mb-3 flex items-center gap-2">
        <input
          type="search"
          value={state.query}
          onChange={(e) => state.setQuery(e.target.value)}
          placeholder="Filter notes"
          aria-label="Filter notes"
          className="min-w-0 flex-1 rounded-md border border-black/15 bg-white/60 px-2.5 py-1.5 text-sm placeholder:text-text-muted focus:border-nav-background focus:outline-none"
        />
      </div>
      <div className="mb-2 flex gap-3 px-2 text-xs text-text-muted">
        <button type="button" onClick={state.expandAll} className="hover:text-foreground hover:underline">
          Expand all
        </button>
        <button type="button" onClick={state.collapseAll} className="hover:text-foreground hover:underline">
          Collapse all
        </button>
      </div>
      {state.visible.length > 0 ? (
        <TreeNodes
          nodes={state.visible}
          depth={0}
          current={state.current}
          isOpen={state.isOpen}
          toggle={state.toggle}
          onNavigate={onNavigate}
        />
      ) : (
        <p className="px-2 text-text-muted">No notes match “{state.query}”.</p>
      )}
    </div>
  );
}

/** Desktop: a sticky column of the whole research hierarchy beside the content. */
export default function ResearchTree({ tree }: { tree: ResearchNavNode[] }) {
  const pathname = usePathname();
  const asideRef = useRef<HTMLElement>(null);

  // Bring the current note into view when arriving on a page
  useEffect(() => {
    asideRef.current?.querySelector('[aria-current="page"]')?.scrollIntoView({ block: "nearest" });
    // pathname is intentionally a dependency so the effect re-runs on navigation.
    // oxlint-disable-next-line react/exhaustive-effect-dependencies
  }, [pathname]);

  return (
    <aside
      ref={asideRef}
      aria-label="Research notes"
      className="hidden shrink-0 px-3 pt-6 pb-10 lg:sticky lg:top-0 lg:block lg:h-screen lg:w-68 lg:overflow-y-auto"
    >
      <Link
        href="/research"
        className={`mb-3 block px-2 font-arizona-flare text-xl text-foreground! hover:no-underline! ${
          pathname === "/research" ? "underline" : ""
        }`}
      >
        Research
      </Link>
      <TreePanel tree={tree} />
    </aside>
  );
}

/** Narrow screens: the same tree behind a "Browse notes" toggle at the top of the page. */
export function ResearchBrowse({ tree, count }: { tree: ResearchNavNode[]; count: number }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close after navigating
  const [closedFor, setClosedFor] = useState(pathname);
  if (pathname !== closedFor) {
    setClosedFor(pathname);
    setOpen(false);
  }

  return (
    <div className="mb-2 lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 rounded-lg border border-black/15 px-3 py-2 text-left font-mallory-book text-sm"
      >
        <Chevron open={open} />
        <span className="flex-1">Browse notes</span>
        <span className="text-text-muted">{count}</span>
      </button>
      {open && (
        <div className="mt-2 max-h-[70vh] overflow-y-auto p-1">
          <TreePanel tree={tree} onNavigate={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}

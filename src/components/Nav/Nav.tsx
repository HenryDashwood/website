"use client";

import { ResearchTreeNode } from "@/lib/research";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const navLinks = [
  {
    name: "Weltanschauung",
    path: "weltanschauung",
  },
  {
    name: "Books",
    path: "books",
  },
  {
    name: "Publications",
    path: "publications",
  },
];

interface NavProps {
  researchTree?: ResearchTreeNode[];
}

interface ResearchTreeNavNodeProps {
  node: ResearchTreeNode;
  parentPath: string;
  isActive: (path: string) => boolean;
  expandedFolders: Set<string>;
  toggleFolder: (path: string) => void;
  onLinkClick: () => void;
  depth?: number;
}

function ResearchTreeNavNode({
  node,
  parentPath,
  isActive,
  expandedFolders,
  toggleFolder,
  onLinkClick,
  depth = 0,
}: ResearchTreeNavNodeProps) {
  const currentPath = parentPath ? `${parentPath}/${node.name}` : node.name;
  const hasChildren = node.children.length > 0;
  const isPage = node.slug !== null;
  const isExpanded = expandedFolders.has(currentPath);
  const displayName =
    node.title ||
    node.name
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  const fullPath = `/research/${node.slug || currentPath}`;
  const isCurrentPage = isActive(fullPath);

  // Folder with no page - just a container
  if (!isPage && hasChildren) {
    return (
      <div className="flex flex-col">
        <button
          onClick={() => toggleFolder(currentPath)}
          className="flex items-center gap-1 rounded-lg px-3 py-2 text-left text-sm transition-all hover:bg-black/5"
          style={{ paddingLeft: `${12 + depth * 12}px` }}
        >
          <svg
            className={`h-3 w-3 shrink-0 transition-transform ${isExpanded ? "rotate-90" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-black/70">{displayName}</span>
        </button>
        {isExpanded && (
          <div className="flex flex-col">
            {node.children.map((child) => (
              <ResearchTreeNavNode
                key={child.name}
                node={child}
                parentPath={currentPath}
                isActive={isActive}
                expandedFolders={expandedFolders}
                toggleFolder={toggleFolder}
                onLinkClick={onLinkClick}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Page (may or may not have children)
  return (
    <div className="flex flex-col">
      <div className="flex items-center">
        {hasChildren && (
          <button
            onClick={() => toggleFolder(currentPath)}
            className="shrink-0 p-1 transition-all hover:bg-black/5"
            style={{ marginLeft: `${8 + depth * 12}px` }}
          >
            <svg
              className={`h-3 w-3 transition-transform ${isExpanded ? "rotate-90" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
        <Link
          href={fullPath}
          onClick={onLinkClick}
          className={`flex-1 rounded-lg px-2 py-2 text-sm break-normal whitespace-normal transition-all ${
            isCurrentPage ? "border-l-4 border-black/30 bg-black/10 font-bold" : "hover:bg-black/5 hover:underline"
          }`}
          style={{
            paddingLeft: hasChildren ? "4px" : `${12 + depth * 12}px`,
          }}
        >
          {displayName}
        </Link>
      </div>
      {hasChildren && isExpanded && (
        <div className="flex flex-col">
          {node.children.map((child) => (
            <ResearchTreeNavNode
              key={child.name}
              node={child}
              parentPath={currentPath}
              isActive={isActive}
              expandedFolders={expandedFolders}
              toggleFolder={toggleFolder}
              onLinkClick={onLinkClick}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Nav({ researchTree = [] }: NavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const mountedRef = useRef(false);
  const pathname = usePathname();

  // Track if component is mounted to avoid hydration issues
  useEffect(() => {
    mountedRef.current = true;
  }, []);

  // Close menu when route changes
  useEffect(() => {
    // Use setTimeout to make state update asynchronous and avoid cascading renders
    const timer = setTimeout(() => {
      setIsOpen(false);
    }, 0);
    return () => clearTimeout(timer);
  }, [pathname]);

  // Prevent body scroll when menu is open on mobile
  useEffect(() => {
    if (!mountedRef.current) return;
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle ESC key to close menu
  useEffect(() => {
    if (!mountedRef.current) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  // Auto-expand folders based on current path
  useEffect(() => {
    if (!pathname?.startsWith("/research/")) return;

    const pathAfterResearch = pathname.replace("/research/", "");
    const segments = pathAfterResearch.split("/").filter(Boolean);

    // Expand all parent folders
    const foldersToExpand = new Set<string>();
    let currentPath = "";
    for (const segment of segments) {
      currentPath = currentPath ? `${currentPath}/${segment}` : segment;
      foldersToExpand.add(currentPath);
    }

    // Use setTimeout to make state update asynchronous and avoid cascading renders
    const timer = setTimeout(() => {
      setExpandedFolders((prev) => {
        const next = new Set(prev);
        foldersToExpand.forEach((f) => next.add(f));
        return next;
      });
    }, 0);
    return () => clearTimeout(timer);
  }, [pathname]);

  const toggleFolder = (folderPath: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderPath)) {
        next.delete(folderPath);
      } else {
        next.add(folderPath);
      }
      return next;
    });
  };

  const isActive = (path: string) => {
    if (!pathname) return false;
    if (path === "/") return pathname === "/";
    // Check for exact match (with or without trailing slash)
    // Remove query strings and hashes for comparison
    const cleanPathname = pathname.split("?")[0].split("#")[0];
    return cleanPathname === path || cleanPathname === `${path}/`;
  };

  return (
    <>
      {/* Mobile: Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-nav-background fixed top-4 left-4 z-50 flex flex-col gap-1.5 rounded-lg p-2.5 shadow-lg transition-all hover:bg-black/10 sm:hidden"
        aria-label="Toggle menu"
        aria-expanded={isOpen}
      >
        <span
          className={`h-0.5 w-6 bg-current transition-all duration-300 ${isOpen ? "translate-y-2 rotate-45" : ""}`}
        />
        <span className={`h-0.5 w-6 bg-current transition-all duration-300 ${isOpen ? "scale-x-0 opacity-0" : ""}`} />
        <span
          className={`h-0.5 w-6 bg-current transition-all duration-300 ${isOpen ? "-translate-y-2 -rotate-45" : ""}`}
        />
      </button>

      {/* Mobile: Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 transition-opacity sm:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Navigation Content */}
      <nav
        className={`bg-nav-background font-mallory-book fixed top-0 left-0 z-40 h-full w-64 overflow-y-auto p-6 pt-20 shadow-xl transition-transform duration-300 ease-in-out sm:sticky sm:top-0 sm:z-auto sm:flex sm:max-h-screen sm:min-h-screen sm:w-50 sm:shrink-0 sm:grow-0 sm:translate-x-0 sm:flex-col sm:self-start sm:p-6 sm:shadow-none ${isOpen ? "translate-x-0" : "-translate-x-full sm:translate-x-0"} `}
      >
        {/* Mobile: Home link */}
        <div className="mb-6 border-b border-black/10 pb-6 sm:hidden">
          <Link
            href="/"
            onClick={() => setIsOpen(false)}
            className={`px-3 text-xl font-bold transition-opacity hover:opacity-80 ${
              isActive("/") ? "underline" : ""
            }`}
          >
            Home
          </Link>
        </div>
        {/* Desktop: Logo/Header */}
        <div className="mb-8 hidden border-b border-black/10 pb-6 sm:block">
          <Link href="/" className="px-3 text-xl font-bold transition-opacity hover:opacity-80">
            Home
          </Link>
        </div>

        {/* Navigation Links */}
        <div className="flex flex-col gap-1 sm:gap-0.5">
          <Link
            href="/posts"
            onClick={() => setIsOpen(false)}
            className={`rounded-lg px-3 py-2.5 break-normal whitespace-normal transition-all sm:py-2 ${
              isActive("/posts")
                ? "-ml-1 border-l-4 border-black/30 bg-black/10 font-bold"
                : "hover:bg-black/5 hover:underline"
            }`}
          >
            Blog Posts
          </Link>

          {navLinks.map(({ name, path }, key) => (
            <Link
              key={key}
              href={`/posts/${path}`}
              onClick={() => setIsOpen(false)}
              className={`rounded-lg px-3 py-2.5 break-normal whitespace-normal transition-all sm:py-2 ${
                isActive(`/posts/${path}`)
                  ? "-ml-1 border-l-4 border-black/30 bg-black/10 font-bold"
                  : "hover:bg-black/5 hover:underline"
              }`}
            >
              {name}
            </Link>
          ))}
        </div>

        {/* Research Section */}
        {researchTree.length > 0 && (
          <>
            <div className="my-6 border-t border-black/10" />
            <div className="flex flex-col gap-1 sm:gap-0.5">
              <Link
                href="/research"
                onClick={() => setIsOpen(false)}
                className={`rounded-lg px-3 py-2.5 break-normal whitespace-normal transition-all sm:py-2 ${
                  isActive("/research")
                    ? "-ml-1 border-l-4 border-black/30 bg-black/10 font-bold"
                    : "hover:bg-black/5 hover:underline"
                }`}
              >
                Research
              </Link>

              {researchTree.map((node) => (
                <ResearchTreeNavNode
                  key={node.name}
                  node={node}
                  parentPath=""
                  isActive={isActive}
                  expandedFolders={expandedFolders}
                  toggleFolder={toggleFolder}
                  onLinkClick={() => setIsOpen(false)}
                />
              ))}
            </div>
          </>
        )}

        {/* Separator */}
        <div className="my-6 border-t border-black/10" />

        {/* External Links Section */}
        <div className="mt-auto">
          <p className="mb-3 px-3 text-xs font-semibold tracking-wider text-black/60 uppercase">External Sites</p>
          <div className="flex flex-col gap-0.5">
            <Link
              href="https://data-science-notes.henrydashwood.com"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 break-normal whitespace-normal transition-all hover:bg-black/5 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Data Science Notes
              <svg className="h-3 w-3 shrink-0 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </Link>

            <Link
              href="https://henrydashwood.github.io/ai-notes"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 break-normal whitespace-normal transition-all hover:bg-black/5 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              AI Notes
              <svg className="h-3 w-3 shrink-0 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </Link>
          </div>
        </div>
      </nav>
    </>
  );
}

export default Nav;

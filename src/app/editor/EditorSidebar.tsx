"use client";

import Link from "next/link";
import { useState } from "react";

interface PostInfo {
  slug: string;
  title: string;
  published: string | null;
  tags: string[];
  description?: string;
}

interface ResearchInfo {
  slug: string;
  title: string;
  created: string | null;
  lastUpdated: string | null;
  tags: string[];
  description?: string;
}

interface ResearchTreeNode {
  name: string;
  slug: string | null;
  title: string | null;
  children: ResearchTreeNode[];
  lastUpdated: string | null;
}

type ContentType = "posts" | "research";

interface EditorSidebarProps {
  posts: PostInfo[];
  research: ResearchInfo[];
  researchTree: ResearchTreeNode[];
  selectedSlug: string;
  contentType: ContentType;
  onSelectItem: (slug: string, type: ContentType) => void;
  onCreateNew: (type: ContentType) => void;
  hasUnsavedChanges: boolean;
}

interface ResearchTreeNavNodeProps {
  node: ResearchTreeNode;
  parentPath: string;
  selectedSlug: string;
  expandedFolders: Set<string>;
  toggleFolder: (path: string) => void;
  onSelectItem: (slug: string) => void;
  depth?: number;
}

function ResearchTreeNavNode({
  node,
  parentPath,
  selectedSlug,
  expandedFolders,
  toggleFolder,
  onSelectItem,
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

  const isCurrentItem = node.slug === selectedSlug;

  // Folder with no page - just a container
  if (!isPage && hasChildren) {
    return (
      <div className="flex flex-col">
        <button
          onClick={() => toggleFolder(currentPath)}
          className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-left text-sm transition-all hover:bg-black/5"
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
          <span className="text-stone-600">{displayName}</span>
        </button>
        {isExpanded && (
          <div className="flex flex-col">
            {node.children.map((child) => (
              <ResearchTreeNavNode
                key={child.name}
                node={child}
                parentPath={currentPath}
                selectedSlug={selectedSlug}
                expandedFolders={expandedFolders}
                toggleFolder={toggleFolder}
                onSelectItem={onSelectItem}
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
        <button
          onClick={() => node.slug && onSelectItem(node.slug)}
          className={`flex-1 rounded-lg px-2 py-1.5 text-left text-sm break-normal whitespace-normal transition-all ${
            isCurrentItem ? "border-l-4 border-amber-600 bg-amber-100 font-medium" : "hover:bg-black/5"
          }`}
          style={{
            paddingLeft: hasChildren ? "4px" : `${12 + depth * 12}px`,
          }}
        >
          {displayName}
        </button>
      </div>
      {hasChildren && isExpanded && (
        <div className="flex flex-col">
          {node.children.map((child) => (
            <ResearchTreeNavNode
              key={child.name}
              node={child}
              parentPath={currentPath}
              selectedSlug={selectedSlug}
              expandedFolders={expandedFolders}
              toggleFolder={toggleFolder}
              onSelectItem={onSelectItem}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function EditorSidebar({
  posts,
  research,
  researchTree,
  selectedSlug,
  contentType,
  onSelectItem,
  onCreateNew,
  hasUnsavedChanges,
}: EditorSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["AI"]));
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["posts", "research"]));

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

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  // Filter posts based on search query
  const filteredPosts = posts.filter((post) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      post.title.toLowerCase().includes(query) ||
      post.slug.toLowerCase().includes(query) ||
      post.tags.some((tag) => tag.toLowerCase().includes(query)) ||
      post.description?.toLowerCase().includes(query)
    );
  });

  // Filter research based on search query
  const filteredResearch = research.filter((item) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(query) ||
      item.slug.toLowerCase().includes(query) ||
      item.tags.some((tag) => tag.toLowerCase().includes(query)) ||
      item.description?.toLowerCase().includes(query)
    );
  });

  // Build filtered research tree (only show matching items and their parents)
  const filterResearchTree = (nodes: ResearchTreeNode[]): ResearchTreeNode[] => {
    if (!searchQuery) return nodes;

    const matchingSlugs = new Set(filteredResearch.map((r) => r.slug));

    const filterNode = (node: ResearchTreeNode): ResearchTreeNode | null => {
      const filteredChildren = node.children.map(filterNode).filter((n): n is ResearchTreeNode => n !== null);

      // Keep if this node matches or has matching children
      if ((node.slug && matchingSlugs.has(node.slug)) || filteredChildren.length > 0) {
        return {
          ...node,
          children: filteredChildren,
        };
      }

      return null;
    };

    return nodes.map(filterNode).filter((n): n is ResearchTreeNode => n !== null);
  };

  const displayResearchTree = filterResearchTree(researchTree);

  const handleSelectItem = (slug: string, type: ContentType) => {
    if (hasUnsavedChanges) {
      const shouldSwitch = window.confirm(
        "You have unsaved changes. Do you want to discard them and switch to another item?"
      );
      if (!shouldSwitch) return;
    }
    onSelectItem(slug, type);
  };

  const handleCreateNew = (type: ContentType) => {
    if (hasUnsavedChanges) {
      const shouldSwitch = window.confirm(
        "You have unsaved changes. Do you want to discard them and create a new item?"
      );
      if (!shouldSwitch) return;
    }
    onCreateNew(type);
  };

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-stone-200 bg-stone-50">
      {/* Header */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-stone-200 px-4">
        <span className="font-medium text-stone-800">Editor</span>
        <Link href="/" className="text-sm text-stone-500 hover:text-stone-700 hover:underline">
          ← Home
        </Link>
      </div>

      {/* Search */}
      <div className="shrink-0 border-b border-stone-200 p-3">
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-8 w-full rounded-md border-0 bg-white px-3 text-sm shadow-sm ring-1 ring-stone-200 placeholder:text-stone-400 focus:ring-2 focus:ring-amber-500"
        />
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Research Section */}
        <div>
          <button
            onClick={() => toggleSection("research")}
            className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-stone-700 hover:bg-stone-100"
          >
            <span>Research ({filteredResearch.length})</span>
            <svg
              className={`h-4 w-4 transition-transform ${expandedSections.has("research") ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {expandedSections.has("research") && (
            <div className="pb-2">
              {/* New Research button */}
              <button
                onClick={() => handleCreateNew("research")}
                className="mx-3 mb-2 flex w-[calc(100%-24px)] items-center justify-center gap-1 rounded-md border border-dashed border-stone-300 py-1.5 text-xs text-stone-500 transition-colors hover:border-amber-400 hover:bg-amber-50 hover:text-amber-600"
              >
                <span>+</span> New Research
              </button>

              {/* Research tree */}
              <div className="flex flex-col px-2">
                {displayResearchTree.map((node) => (
                  <ResearchTreeNavNode
                    key={node.name}
                    node={node}
                    parentPath=""
                    selectedSlug={contentType === "research" ? selectedSlug : ""}
                    expandedFolders={expandedFolders}
                    toggleFolder={toggleFolder}
                    onSelectItem={(slug) => handleSelectItem(slug, "research")}
                  />
                ))}
                {displayResearchTree.length === 0 && (
                  <div className="px-3 py-2 text-xs text-stone-400">
                    {searchQuery ? "No research matches your search" : "No research found"}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Posts Section */}
        <div className="border-b border-stone-200">
          <button
            onClick={() => toggleSection("posts")}
            className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-stone-700 hover:bg-stone-100"
          >
            <span>Posts ({filteredPosts.length})</span>
            <svg
              className={`h-4 w-4 transition-transform ${expandedSections.has("posts") ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {expandedSections.has("posts") && (
            <div className="pb-2">
              {/* New Post button */}
              <button
                onClick={() => handleCreateNew("posts")}
                className="mx-3 mb-2 flex w-[calc(100%-24px)] items-center justify-center gap-1 rounded-md border border-dashed border-stone-300 py-1.5 text-xs text-stone-500 transition-colors hover:border-amber-400 hover:bg-amber-50 hover:text-amber-600"
              >
                <span>+</span> New Post
              </button>

              {/* Posts list */}
              <div className="flex flex-col gap-0.5 px-2">
                {filteredPosts.map((post) => (
                  <button
                    key={post.slug}
                    onClick={() => handleSelectItem(post.slug, "posts")}
                    className={`rounded-md px-3 py-1.5 text-left text-sm transition-all ${
                      selectedSlug === post.slug && contentType === "posts"
                        ? "border-l-4 border-amber-600 bg-amber-100 font-medium"
                        : "hover:bg-stone-100"
                    }`}
                    title={post.description || post.title}
                  >
                    <div className="truncate">{post.title}</div>
                    {post.published && (
                      <div className="truncate text-xs text-stone-400">
                        {new Date(post.published).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                    )}
                  </button>
                ))}
                {filteredPosts.length === 0 && (
                  <div className="px-3 py-2 text-xs text-stone-400">
                    {searchQuery ? "No posts match your search" : "No posts found"}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer with counts */}
      <div className="shrink-0 border-t border-stone-200 px-4 py-2 text-xs text-stone-400">
        {posts.length} posts, {research.length} research items
      </div>
    </aside>
  );
}

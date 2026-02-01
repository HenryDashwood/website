"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import type { EditorActions } from "./LiveEditor";

// Dynamically import editors to avoid SSR issues
const LiveEditor = dynamic(() => import("./LiveEditor"), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 items-center justify-center">
      <div className="text-gray-500">Loading editor...</div>
    </div>
  ),
});

const MDXPreview = dynamic(() => import("./MDXPreview"), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 items-center justify-center">
      <div className="text-gray-500">Loading preview...</div>
    </div>
  ),
});

const EditorSidebar = dynamic(() => import("./EditorSidebar"), {
  ssr: false,
  loading: () => <div className="h-screen w-64 shrink-0 animate-pulse bg-stone-100" />,
});

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
type ViewMode = "edit" | "preview";

function EditorContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Read initial values from URL
  const initialType = (searchParams.get("type") as ContentType) || "posts";
  const initialSlug = searchParams.get("slug") || searchParams.get("post") || ""; // Support legacy "post" param

  const [contentType, setContentType] = useState<ContentType>(initialType);
  const [posts, setPosts] = useState<PostInfo[]>([]);
  const [research, setResearch] = useState<ResearchInfo[]>([]);
  const [researchTree, setResearchTree] = useState<ResearchTreeNode[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string>(initialSlug);
  const [selectedPost, setSelectedPost] = useState<PostInfo | null>(null);
  const [selectedResearch, setSelectedResearch] = useState<ResearchInfo | null>(null);
  const [content, setContent] = useState<string>("");
  const [originalContent, setOriginalContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isFormatting, setIsFormatting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newItemSlug, setNewItemSlug] = useState("");
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemDescription, setNewItemDescription] = useState("");
  const [newItemTags, setNewItemTags] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("edit");
  const [fileMtime, setFileMtime] = useState<number | null>(null);
  const [footnoteModalOpen, setFootnoteModalOpen] = useState(false);
  const [footnoteText, setFootnoteText] = useState("");
  const contentRef = useRef(content);
  const editorActionsRef = useRef<EditorActions | null>(null);
  const isCheckingRef = useRef(false);
  const footnoteInputRef = useRef<HTMLTextAreaElement>(null);
  const hasLoadedFromUrl = useRef(false);

  // Update URL when selected item changes (without triggering navigation)
  const updateUrl = useCallback(
    (type: ContentType, slug: string) => {
      const params = new URLSearchParams();
      params.set("type", type);
      if (slug) {
        params.set("slug", slug);
      }
      const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
      router.replace(newUrl, { scroll: false });
    },
    [pathname, router]
  );

  // Keep ref in sync
  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  // Check if in development mode
  const [isDev, setIsDev] = useState<boolean | null>(null);

  // Fetch posts
  useEffect(() => {
    fetch("/api/editor/posts")
      .then((res) => {
        if (res.status === 403) {
          setIsDev(false);
        } else {
          setIsDev(true);
          return res.json();
        }
      })
      .then((data) => {
        if (data) {
          setPosts(data);
        }
      })
      .catch(() => {
        setIsDev(false);
      });
  }, []);

  // Fetch research
  useEffect(() => {
    fetch("/api/editor/research")
      .then((res) => {
        if (res.ok) {
          return res.json();
        }
      })
      .then((data) => {
        if (data) {
          setResearch(data);
        }
      })
      .catch(() => {
        // Silently fail - research endpoint might not exist yet
      });
  }, []);

  // Fetch research tree for sidebar
  useEffect(() => {
    fetch("/api/editor/research-tree")
      .then((res) => {
        if (res.ok) {
          return res.json();
        }
      })
      .then((data) => {
        if (data) {
          setResearchTree(data);
        }
      })
      .catch(() => {
        // Silently fail
      });
  }, []);

  const loadItem = useCallback(
    async (slug: string, type: ContentType) => {
      if (!slug) {
        setContent("");
        setOriginalContent("");
        setSelectedPost(null);
        setSelectedResearch(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const typeParam = type === "posts" ? "post" : "research";
        const res = await fetch(`/api/editor/read?slug=${encodeURIComponent(slug)}&type=${typeParam}`);
        if (!res.ok) {
          throw new Error(`Failed to load ${type === "posts" ? "post" : "research"}`);
        }
        const data = await res.json();
        setContent(data.content);
        setOriginalContent(data.content);
        setFileMtime(data.mtime);

        // Find the item metadata
        if (type === "posts") {
          const post = posts.find((p) => p.slug === slug);
          setSelectedPost(post || null);
          setSelectedResearch(null);
        } else {
          const researchItem = research.find((r) => r.slug === slug);
          setSelectedResearch(researchItem || null);
          setSelectedPost(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : `Failed to load ${type === "posts" ? "post" : "research"}`);
      } finally {
        setIsLoading(false);
      }
    },
    [posts, research]
  );

  // Load item from URL on initial mount (once data is available)
  useEffect(() => {
    if (!hasLoadedFromUrl.current && initialSlug && !isLoading) {
      const dataAvailable = initialType === "posts" ? posts.length > 0 : research.length > 0;
      if (dataAvailable) {
        hasLoadedFromUrl.current = true;
        loadItem(initialSlug, initialType);
      }
    }
  }, [initialSlug, initialType, posts, research, isLoading, loadItem]);

  // Check for external file changes (e.g., edited in Cursor)
  const checkForExternalChanges = useCallback(async () => {
    if (!selectedSlug || isCheckingRef.current || isSaving) return;

    isCheckingRef.current = true;
    try {
      const typeParam = contentType === "posts" ? "post" : "research";
      const res = await fetch(
        `/api/editor/read?slug=${encodeURIComponent(selectedSlug)}&type=${typeParam}&checkOnly=true&mtime=${fileMtime}`
      );
      if (!res.ok) return;

      const data = await res.json();
      if (data.changed && data.content) {
        // File was modified externally
        const currentContent = contentRef.current;
        if (data.content !== currentContent) {
          // Ask user if they want to reload
          const shouldReload = window.confirm(
            "This file was modified externally. Do you want to reload it?\n\n" +
              "Click OK to reload (your changes will be lost), or Cancel to keep your version."
          );
          if (shouldReload) {
            setContent(data.content);
            setOriginalContent(data.content);
            setFileMtime(data.mtime);
          } else {
            // User wants to keep their version, update mtime to avoid repeated prompts
            setFileMtime(data.mtime);
          }
        } else {
          // Content is the same, just update mtime
          setFileMtime(data.mtime);
        }
      }
    } catch {
      // Silently ignore check errors
    } finally {
      isCheckingRef.current = false;
    }
  }, [selectedSlug, contentType, fileMtime, isSaving]);

  // Check for external changes when tab gains focus
  useEffect(() => {
    const handleFocus = () => {
      checkForExternalChanges();
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [checkForExternalChanges]);

  // Handle selecting an item from the sidebar
  const handleSelectItem = useCallback(
    (slug: string, type: ContentType) => {
      setIsCreatingNew(false);
      setIsLoading(true);
      setSelectedSlug(slug);
      setContentType(type);
      updateUrl(type, slug);
      loadItem(slug, type);
    },
    [updateUrl, loadItem]
  );

  // Handle creating new item from sidebar
  const handleCreateNew = useCallback(
    (type: ContentType) => {
      setIsCreatingNew(true);
      setContentType(type);
      setSelectedSlug("");
      setSelectedPost(null);
      setSelectedResearch(null);
      setContent("");
      setOriginalContent("");
      setNewItemSlug("");
      setNewItemTitle("");
      setNewItemDescription("");
      setNewItemTags("");
      updateUrl(type, "");
    },
    [updateUrl]
  );

  // Get currently selected item for display
  const selectedItem = contentType === "posts" ? selectedPost : selectedResearch;

  const handleSave = useCallback(async () => {
    if (!selectedSlug && !isCreatingNew) return;

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const typeParam = contentType === "posts" ? "post" : "research";
      const body = isCreatingNew
        ? {
            slug: newItemSlug,
            content: contentRef.current,
            type: typeParam,
            createNew: true,
            metadata: {
              title: newItemTitle,
              description: newItemDescription,
              tags: newItemTags
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean),
            },
          }
        : {
            slug: selectedSlug,
            content: contentRef.current,
            type: typeParam,
          };

      const res = await fetch("/api/editor/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to save");
      }

      const data = await res.json();

      // Mark current content as saved - don't update editor to avoid UI flash
      // The editor already has what the user typed, just sync the "original" state
      setOriginalContent(contentRef.current);

      // Update mtime
      if (data.mtime) {
        setFileMtime(data.mtime);
      }

      setSuccessMessage("Saved!");

      if (isCreatingNew) {
        const today = new Date().toISOString().split("T")[0];
        const tags = newItemTags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);

        if (contentType === "posts") {
          const postsRes = await fetch("/api/editor/posts");
          const postsData = await postsRes.json();
          setPosts(postsData);
          setSelectedPost({
            slug: newItemSlug,
            title: newItemTitle,
            published: today,
            tags,
            description: newItemDescription,
          });
        } else {
          const researchRes = await fetch("/api/editor/research");
          const researchData = await researchRes.json();
          setResearch(researchData);
          // Also refresh research tree
          const treeRes = await fetch("/api/editor/research-tree");
          const treeData = await treeRes.json();
          setResearchTree(treeData);
          setSelectedResearch({
            slug: newItemSlug,
            title: newItemTitle,
            created: today,
            lastUpdated: today,
            tags,
            description: newItemDescription,
          });
        }

        setSelectedSlug(newItemSlug);
        updateUrl(contentType, newItemSlug);
        setIsCreatingNew(false);
        setNewItemSlug("");
        setNewItemTitle("");
        setNewItemDescription("");
        setNewItemTags("");
      }

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  }, [
    selectedSlug,
    isCreatingNew,
    contentType,
    newItemSlug,
    newItemTitle,
    newItemDescription,
    newItemTags,
    updateUrl,
  ]);

  // Format content with prettier (saves and syncs formatted content back)
  const handleFormat = useCallback(async () => {
    if (!selectedSlug || isFormatting || isSaving) return;

    setIsFormatting(true);
    setError(null);

    try {
      const typeParam = contentType === "posts" ? "post" : "research";
      const res = await fetch("/api/editor/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: selectedSlug,
          content: contentRef.current,
          type: typeParam,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to format");
      }

      const data = await res.json();

      // Update editor with formatted content
      if (data.content && editorActionsRef.current) {
        editorActionsRef.current.setContent(data.content);
        setOriginalContent(data.content);
        contentRef.current = data.content;
      }

      if (data.mtime) {
        setFileMtime(data.mtime);
      }

      setSuccessMessage("Formatted!");
      setTimeout(() => setSuccessMessage(null), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to format");
    } finally {
      setIsFormatting(false);
    }
  }, [selectedSlug, isFormatting, isSaving, contentType]);

  // Footnote handling
  const handleFootnoteInsert = useCallback(() => {
    if (!editorActionsRef.current) return;

    const currentContent = editorActionsRef.current.getContent();
    const cursorPos = editorActionsRef.current.getCursorPosition();

    // Find all existing footnote references [^N] in the content (not definitions)
    const refRegex = /\[\^(\d+)\]/g;
    const existingRefs: { num: number; index: number }[] = [];
    let match;
    while ((match = refRegex.exec(currentContent)) !== null) {
      // Only count references that appear in text (not the definitions at bottom)
      // Definitions look like [^N]: at the start of a line
      const lineStart = currentContent.lastIndexOf("\n", match.index) + 1;
      const beforeMatch = currentContent.slice(lineStart, match.index);
      if (!beforeMatch.match(/^\s*$/)) {
        // This is an inline reference, not a definition
        existingRefs.push({ num: parseInt(match[1]), index: match.index });
      } else if (!currentContent.slice(match.index).startsWith(`[^${match[1]}]:`)) {
        // Also count standalone refs that aren't definitions
        existingRefs.push({ num: parseInt(match[1]), index: match.index });
      }
    }

    // Find refs that come before cursor position to determine the new footnote number
    const refsBefore = existingRefs.filter((r) => r.index < cursorPos);
    const newNum = refsBefore.length + 1;

    // Check if we need to renumber refs that come after
    const refsAfter = existingRefs.filter((r) => r.index >= cursorPos);
    const needsRenumbering = refsAfter.length > 0;

    if (needsRenumbering) {
      // We need to renumber - this requires inserting and then updating the content
      const newRef = `[^${newNum}]`;

      // Build new content with renumbered footnotes
      let newContent = currentContent;

      // Get unique footnote numbers that need renumbering (from refs after cursor)
      const numsToRenumber = [...new Set(refsAfter.map((r) => r.num))].sort((a, b) => b - a);

      // Renumber references and definitions (increment by 1)
      // Process in descending order to avoid conflicts
      for (const oldNum of numsToRenumber) {
        const newNumForRef = oldNum + 1;
        // Use temp markers to avoid double-replacement
        newContent = newContent.replace(new RegExp(`\\[\\^${oldNum}\\]`, "g"), `[^__TEMP_${newNumForRef}__]`);
      }

      // Now replace temp markers with actual numbers
      for (const oldNum of numsToRenumber) {
        const newNumForRef = oldNum + 1;
        newContent = newContent.replace(new RegExp(`\\[\\^__TEMP_${newNumForRef}__\\]`, "g"), `[^${newNumForRef}]`);
      }

      // Insert the new reference at cursor
      newContent = newContent.slice(0, cursorPos) + newRef + newContent.slice(cursorPos);

      // Now find the right position to insert the new definition
      // Look for existing definitions and find where the new one should go
      const defRegex = /\n\[\^(\d+)\]:/g;
      const definitions: { num: number; index: number }[] = [];
      let defMatch;
      while ((defMatch = defRegex.exec(newContent)) !== null) {
        definitions.push({ num: parseInt(defMatch[1]), index: defMatch.index });
      }

      // Sort definitions by their number
      definitions.sort((a, b) => a.num - b.num);

      // Find where to insert the new definition
      const newDefText = `\n\n[^${newNum}]: ${footnoteText}`;

      if (definitions.length === 0) {
        // No existing definitions, append at end
        newContent = newContent + newDefText;
      } else {
        // Find the definition with number > newNum (this is where we insert before)
        const insertBeforeDef = definitions.find((d) => d.num > newNum);

        if (insertBeforeDef) {
          // Insert before this definition
          newContent =
            newContent.slice(0, insertBeforeDef.index) + newDefText + newContent.slice(insertBeforeDef.index);
        } else {
          // All existing definitions have lower numbers, append at end
          newContent = newContent + newDefText;
        }
      }

      // Update content through the parent state
      setContent(newContent);
    } else {
      // Simple case - just insert at cursor and append definition
      editorActionsRef.current.insertText(`[^${newNum}]`, `\n\n[^${newNum}]: ${footnoteText}`);
    }

    setFootnoteModalOpen(false);
    setFootnoteText("");
  }, [footnoteText]);

  // Focus the textarea when modal opens
  useEffect(() => {
    if (footnoteModalOpen && footnoteInputRef.current) {
      footnoteInputRef.current.focus();
    }
  }, [footnoteModalOpen]);

  // Keyboard shortcuts - use capture phase to intercept before browser default behavior
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // CMD+S - Save (handle this first and stop propagation to prevent any browser refresh)
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        e.stopPropagation();
        if ((selectedSlug || isCreatingNew) && !isSaving) {
          handleSave();
        }
        return; // Exit early to prevent any other handling
      }
      // CMD+E - Toggle view mode
      if ((e.metaKey || e.ctrlKey) && e.key === "e") {
        e.preventDefault();
        e.stopPropagation();
        setViewMode((prev) => (prev === "edit" ? "preview" : "edit"));
        return;
      }
      // CMD+Z - Undo, CMD+Shift+Z - Redo (only for CodeMirror editor)
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        if (editorActionsRef.current) {
          e.preventDefault();
          e.stopPropagation();
          if (e.shiftKey) {
            editorActionsRef.current.redo();
          } else {
            editorActionsRef.current.undo();
          }
        }
      }
    };
    // Use capture phase to intercept events before they reach other handlers
    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [selectedSlug, isCreatingNew, isSaving, handleSave]);

  const hasUnsavedChanges = content !== originalContent;

  // Format date helper
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (isDev === null) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (isDev === false) {
    return (
      <div className="bg-background flex min-h-screen flex-col items-center justify-center">
        <h1 className="mb-4 text-2xl font-bold text-red-600">Access Denied</h1>
        <p className="text-gray-600">The editor is only available in development mode.</p>
        <Link href="/" className="text-link mt-4 hover:underline">
          Return to home
        </Link>
      </div>
    );
  }

  // Check if we have content to edit
  const hasContent = selectedSlug || isCreatingNew;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <EditorSidebar
        posts={posts}
        research={research}
        researchTree={researchTree}
        selectedSlug={selectedSlug}
        contentType={contentType}
        onSelectItem={handleSelectItem}
        onCreateNew={handleCreateNew}
        hasUnsavedChanges={hasUnsavedChanges}
      />

      {/* Main content area */}
      <div className="bg-background flex flex-1 flex-col overflow-hidden">
        {/* Toast notifications - fixed position, no layout shift */}
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
          {error && (
            <div className="animate-in slide-in-from-right rounded-lg bg-red-600 px-4 py-2 text-sm text-white shadow-lg">
              {error}
            </div>
          )}
          {successMessage && (
            <div className="animate-in slide-in-from-right rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white shadow-lg">
              ✓ Saved
            </div>
          )}
        </div>

        {/* Header */}
        <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-4 border-b border-stone-300 bg-stone-100 px-4">
          {hasContent ? (
            <>
              {/* Item title */}
              <span className="max-w-[400px] truncate text-sm font-medium text-stone-800">
                {isCreatingNew
                  ? `New ${contentType === "posts" ? "Post" : "Research"}`
                  : selectedItem?.title || "Loading..."}
              </span>

              <div className="flex items-center gap-1">
                {/* View mode toggle */}
                <button
                  onClick={() => setViewMode("edit")}
                  className={`h-8 rounded px-3 text-sm font-medium transition-colors ${
                    viewMode === "edit"
                      ? "bg-amber-500 text-white"
                      : "text-stone-600 hover:bg-stone-200 hover:text-stone-900"
                  }`}
                >
                  Edit
                </button>
                <button
                  onClick={() => setViewMode("preview")}
                  className={`h-8 rounded px-3 text-sm font-medium transition-colors ${
                    viewMode === "preview"
                      ? "bg-amber-500 text-white"
                      : "text-stone-600 hover:bg-stone-200 hover:text-stone-900"
                  }`}
                >
                  Preview
                </button>
              </div>

              {/* Status indicator */}
              <div className="ml-auto flex items-center gap-3">
                {isSaving && <span className="text-xs text-stone-500">Saving...</span>}
                {!isSaving && hasUnsavedChanges && <span className="text-xs text-amber-600">● Unsaved</span>}
                {!isSaving && !hasUnsavedChanges && selectedSlug && (
                  <span className="text-xs text-stone-400">✓ Saved</span>
                )}
              </div>
            </>
          ) : (
            <span className="text-sm text-stone-500">Select a post or research item from the sidebar</span>
          )}
        </header>

        {/* Toolbar - only in edit mode with content selected */}
        {viewMode === "edit" && hasContent && (
          <div className="sticky top-14 z-30 flex h-10 shrink-0 items-center gap-1 border-b border-stone-200 bg-stone-50 px-4">
            <span className="mr-2 text-xs text-stone-400">Insert:</span>
            {[
              {
                label: "Image",
                icon: "🖼",
                text: `<LocalImage\n  src="/images/your-image.jpg"\n  alt="Description"\n  caption="Optional caption"\n/>`,
              },
              {
                label: "Side by Side",
                icon: "⧉",
                text: `<LocalImageSideBySide\n  leftSrc="/images/left.jpg"\n  rightSrc="/images/right.jpg"\n  leftAlt="Left image"\n  rightAlt="Right image"\n/>`,
              },
              {
                label: "Grid",
                icon: "▦",
                text: `<LocalImageGrid\n  images={[\n    { src: "/images/1.jpg", alt: "Image 1" },\n    { src: "/images/2.jpg", alt: "Image 2" },\n  ]}\n/>`,
              },
              {
                label: "Details",
                icon: "▸",
                text: `<details>\n<summary>Click to expand</summary>\n\nYour content here...\n\n</details>`,
              },
              { label: "Maths", icon: "∑", text: `$$\n\\begin{aligned}\nx &= y \\\\\n\\end{aligned}\n$$` },
              { label: "Code", icon: "</>", text: "```typescript\n// Your code here\n```" },
              {
                label: "Table",
                icon: "▤",
                text: `| Column 1 | Column 2 | Column 3 |\n| -------- | -------- | -------- |\n| Cell 1   | Cell 2   | Cell 3   |`,
              },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => editorActionsRef.current?.insertText(item.text)}
                className="flex h-7 items-center gap-1.5 rounded px-2 text-xs text-stone-600 hover:bg-stone-200 hover:text-stone-900"
                title={`Insert ${item.label}`}
              >
                <span className="text-stone-400">{item.icon}</span>
                {item.label}
              </button>
            ))}
            {/* Footnote button - opens modal */}
            <button
              onClick={() => setFootnoteModalOpen(true)}
              className="flex h-7 items-center gap-1.5 rounded px-2 text-xs text-stone-600 hover:bg-stone-200 hover:text-stone-900"
              title="Insert Footnote"
            >
              <span className="text-stone-400">¹</span>
              Footnote
            </button>

            {/* Separator */}
            <div className="mx-2 h-5 w-px bg-stone-300" />

            {/* Format button */}
            <button
              onClick={handleFormat}
              disabled={isFormatting || !selectedSlug}
              className="flex h-7 items-center gap-1.5 rounded px-2 text-xs text-stone-600 hover:bg-stone-200 hover:text-stone-900 disabled:cursor-not-allowed disabled:opacity-50"
              title="Format with Prettier (saves file)"
            >
              <span className="text-stone-400">✨</span>
              {isFormatting ? "Formatting..." : "Format"}
            </button>
          </div>
        )}

        {/* New item form - collapsible panel */}
        {isCreatingNew && (
          <div className="shrink-0 border-b border-stone-200 bg-amber-50 px-4 py-3">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-600">
                  {contentType === "posts" ? "Slug" : "Path"}
                </label>
                <input
                  type="text"
                  value={newItemSlug}
                  onChange={(e) => {
                    if (contentType === "posts") {
                      // Posts: only allow lowercase letters, numbers, and hyphens
                      setNewItemSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"));
                    } else {
                      // Research: allow letters, numbers, hyphens, and forward slashes
                      setNewItemSlug(e.target.value.replace(/[^a-zA-Z0-9-/]/g, ""));
                    }
                  }}
                  placeholder={contentType === "posts" ? "my-new-post" : "AI/topic/subtopic"}
                  className="h-8 w-full rounded border-0 px-2 text-sm shadow-sm ring-1 ring-stone-200 focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-600">Title</label>
                <input
                  type="text"
                  value={newItemTitle}
                  onChange={(e) => setNewItemTitle(e.target.value)}
                  placeholder={contentType === "posts" ? "My New Post" : "Research Title"}
                  className="h-8 w-full rounded border-0 px-2 text-sm shadow-sm ring-1 ring-stone-200 focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-600">Description</label>
                <input
                  type="text"
                  value={newItemDescription}
                  onChange={(e) => setNewItemDescription(e.target.value)}
                  placeholder="A description..."
                  className="h-8 w-full rounded border-0 px-2 text-sm shadow-sm ring-1 ring-stone-200 focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-600">Tags</label>
                <input
                  type="text"
                  value={newItemTags}
                  onChange={(e) => setNewItemTags(e.target.value)}
                  placeholder="Tag1, Tag2"
                  className="h-8 w-full rounded border-0 px-2 text-sm shadow-sm ring-1 ring-stone-200 focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 overflow-auto">
          {!hasContent ? (
            <div className="flex h-full items-center justify-center text-stone-400">
              <div className="text-center">
                <p className="mb-2">No content selected</p>
                <p className="text-sm">Choose a post or research item from the sidebar to start editing</p>
              </div>
            </div>
          ) : isLoading ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-gray-500">Loading {contentType === "posts" ? "post" : "research"}...</div>
            </div>
          ) : viewMode === "edit" ? (
            <LiveEditor
              content={content}
              onChange={setContent}
              postKey={selectedSlug || (isCreatingNew ? "new" : undefined)}
              onReady={(actions) => {
                editorActionsRef.current = actions;
              }}
              metadata={
                selectedItem
                  ? {
                      title: selectedItem.title,
                      published:
                        contentType === "posts"
                          ? (selectedItem as PostInfo).published
                          : (selectedItem as ResearchInfo).lastUpdated,
                      tags: selectedItem.tags,
                      description: selectedItem.description,
                    }
                  : isCreatingNew
                    ? {
                        title: newItemTitle || (contentType === "posts" ? "New Post" : "New Research"),
                        published: new Date().toISOString().split("T")[0],
                        tags: newItemTags
                          .split(",")
                          .map((t) => t.trim())
                          .filter(Boolean),
                        description: newItemDescription,
                      }
                    : undefined
              }
            />
          ) : (
            <div className="min-h-full" style={{ backgroundColor: "var(--background)" }}>
              {/* Full preview with title and metadata, matching actual rendering */}
              <div className="mx-auto max-w-4xl px-6 py-8">
                {selectedItem && (
                  <>
                    <h1 className="font-arizona-flare mb-4 text-4xl font-normal">{selectedItem.title}</h1>
                    {contentType === "posts" && (selectedItem as PostInfo).published && (
                      <div className="font-mallory-book mb-6 text-gray-600">
                        {formatDate((selectedItem as PostInfo).published!)}
                      </div>
                    )}
                    {contentType === "research" && (
                      <div className="font-mallory-book mb-6 text-sm text-gray-600">
                        {(selectedItem as ResearchInfo).lastUpdated && (
                          <div>Last updated: {formatDate((selectedItem as ResearchInfo).lastUpdated!)}</div>
                        )}
                        {(selectedItem as ResearchInfo).created && (
                          <div>Created: {formatDate((selectedItem as ResearchInfo).created!)}</div>
                        )}
                      </div>
                    )}
                  </>
                )}
                <div className="prose-content">
                  <MDXPreview content={content} />
                </div>
                {selectedItem?.tags && selectedItem.tags.length > 0 && (
                  <div className="font-mallory-book mt-8 text-gray-600">
                    <p>Tags: {selectedItem.tags.join(", ")}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footnote Modal */}
        {footnoteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
              <h2 className="mb-4 text-lg font-semibold text-stone-800">Insert Footnote</h2>
              <p className="mb-3 text-sm text-stone-600">
                Enter the footnote text. The footnote number will be automatically determined based on its position in
                the document.
              </p>
              <textarea
                ref={footnoteInputRef}
                value={footnoteText}
                onChange={(e) => setFootnoteText(e.target.value)}
                placeholder="Enter footnote text or citation..."
                className="mb-4 h-32 w-full resize-none rounded-md border border-stone-300 p-3 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    handleFootnoteInsert();
                  }
                  if (e.key === "Escape") {
                    setFootnoteModalOpen(false);
                    setFootnoteText("");
                  }
                }}
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setFootnoteModalOpen(false);
                    setFootnoteText("");
                  }}
                  className="rounded-md px-4 py-2 text-sm text-stone-600 hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFootnoteInsert}
                  disabled={!footnoteText.trim()}
                  className="rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Insert Footnote
                </button>
              </div>
              <p className="mt-3 text-xs text-stone-400">Press ⌘+Enter to insert, Escape to cancel</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Wrap in Suspense for useSearchParams
export default function EditorPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-background flex min-h-screen items-center justify-center">
          <div className="text-lg">Loading editor...</div>
        </div>
      }
    >
      <EditorContent />
    </Suspense>
  );
}

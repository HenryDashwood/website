"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
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

interface PostInfo {
  slug: string;
  title: string;
  published: string | null;
  tags: string[];
  description?: string;
}

type ViewMode = "edit" | "preview";

export default function EditorPage() {
  const [posts, setPosts] = useState<PostInfo[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string>("");
  const [selectedPost, setSelectedPost] = useState<PostInfo | null>(null);
  const [content, setContent] = useState<string>("");
  const [originalContent, setOriginalContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newPostSlug, setNewPostSlug] = useState("");
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostDescription, setNewPostDescription] = useState("");
  const [newPostTags, setNewPostTags] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("edit");
  const [fileMtime, setFileMtime] = useState<number | null>(null);
  const contentRef = useRef(content);
  const editorActionsRef = useRef<EditorActions | null>(null);
  const isCheckingRef = useRef(false);

  // Keep ref in sync
  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  // Check if in development mode
  const [isDev, setIsDev] = useState<boolean | null>(null);

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

  const loadPost = useCallback(
    async (slug: string) => {
      if (!slug) {
        setContent("");
        setOriginalContent("");
        setSelectedPost(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/editor/read?slug=${encodeURIComponent(slug)}`);
        if (!res.ok) {
          throw new Error("Failed to load post");
        }
        const data = await res.json();
        setContent(data.content);
        setOriginalContent(data.content);
        setFileMtime(data.mtime);

        // Find the post metadata
        const post = posts.find((p) => p.slug === slug);
        setSelectedPost(post || null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load post");
      } finally {
        setIsLoading(false);
      }
    },
    [posts]
  );

  // Check for external file changes (e.g., edited in Cursor)
  const checkForExternalChanges = useCallback(async () => {
    if (!selectedSlug || isCheckingRef.current || isSaving) return;

    isCheckingRef.current = true;
    try {
      const res = await fetch(
        `/api/editor/read?slug=${encodeURIComponent(selectedSlug)}&checkOnly=true&mtime=${fileMtime}`
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
  }, [selectedSlug, fileMtime, isSaving]);

  // Check for external changes when tab gains focus
  useEffect(() => {
    const handleFocus = () => {
      checkForExternalChanges();
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [checkForExternalChanges]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const slug = e.target.value;
    if (slug === "__new__") {
      setIsCreatingNew(true);
      setSelectedSlug("");
      setSelectedPost(null);
      setContent("");
      setOriginalContent("");
    } else {
      setIsCreatingNew(false);
      setIsLoading(true); // Set loading BEFORE changing slug to prevent editor from rendering with empty content
      setSelectedSlug(slug);
      loadPost(slug);
    }
  };

  const handleSave = useCallback(async () => {
    if (!selectedSlug && !isCreatingNew) return;

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const body = isCreatingNew
        ? {
            slug: newPostSlug,
            content: contentRef.current,
            createNew: true,
            metadata: {
              title: newPostTitle,
              description: newPostDescription,
              tags: newPostTags
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean),
            },
          }
        : {
            slug: selectedSlug,
            content: contentRef.current,
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

      // Update with formatted content from prettier
      if (data.content) {
        setContent(data.content);
        setOriginalContent(data.content);
        contentRef.current = data.content;
      } else {
        setOriginalContent(contentRef.current);
      }

      // Update mtime
      if (data.mtime) {
        setFileMtime(data.mtime);
      }

      setSuccessMessage("Saved!");

      if (isCreatingNew) {
        const postsRes = await fetch("/api/editor/posts");
        const postsData = await postsRes.json();
        setPosts(postsData);
        setSelectedSlug(newPostSlug);
        setSelectedPost({
          slug: newPostSlug,
          title: newPostTitle,
          published: new Date().toISOString().split("T")[0],
          tags: newPostTags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          description: newPostDescription,
        });
        setIsCreatingNew(false);
        setNewPostSlug("");
        setNewPostTitle("");
        setNewPostDescription("");
        setNewPostTags("");
      }

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  }, [selectedSlug, isCreatingNew, newPostSlug, newPostTitle, newPostDescription, newPostTags]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // CMD+E - Toggle view mode
      if ((e.metaKey || e.ctrlKey) && e.key === "e") {
        e.preventDefault();
        setViewMode((prev) => (prev === "edit" ? "preview" : "edit"));
      }
      // CMD+S - Save
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if ((selectedSlug || isCreatingNew) && !isSaving) {
          handleSave();
        }
      }
      // CMD+Z - Undo, CMD+Shift+Z - Redo (only for CodeMirror editor)
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        if (editorActionsRef.current) {
          e.preventDefault();
          if (e.shiftKey) {
            editorActionsRef.current.redo();
          } else {
            editorActionsRef.current.undo();
          }
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
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

  return (
    <div className="bg-background flex min-h-screen flex-col">
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

      {/* Header - clean single row */}
      <header className="sticky top-0 z-50 flex h-14 shrink-0 items-center gap-4 border-b border-stone-300 bg-stone-100 px-4">
        <Link href="/" className="text-stone-600 hover:text-stone-900">
          ←
        </Link>
        <div className="h-5 w-px bg-stone-300" />

        {/* Post selector */}
        <select
          value={isCreatingNew ? "__new__" : selectedSlug}
          onChange={handleSelectChange}
          className="h-8 max-w-[400px] min-w-[200px] flex-1 rounded border-0 bg-white px-2 text-sm shadow-sm ring-1 ring-stone-200 focus:ring-2 focus:ring-amber-500"
        >
          <option value="">Select a post...</option>
          <option value="__new__">+ New post</option>
          {posts.map((post) => (
            <option key={post.slug} value={post.slug}>
              {post.title}
            </option>
          ))}
        </select>

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
          {!isSaving && !hasUnsavedChanges && selectedSlug && <span className="text-xs text-stone-400">✓ Saved</span>}
        </div>
      </header>

      {/* Toolbar - only in edit mode with a post selected */}
      {viewMode === "edit" && (selectedSlug || isCreatingNew) && (
        <div className="sticky top-14 z-40 flex h-10 shrink-0 items-center gap-1 border-b border-stone-200 bg-stone-50 px-4">
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
            { label: "Math", icon: "∑", text: `$$\n\\begin{aligned}\nx &= y \\\\\n\\end{aligned}\n$$` },
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
        </div>
      )}

      {/* New post form - collapsible panel */}
      {isCreatingNew && (
        <div className="shrink-0 border-b border-stone-200 bg-amber-50 px-4 py-3">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-600">Slug</label>
              <input
                type="text"
                value={newPostSlug}
                onChange={(e) => setNewPostSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                placeholder="my-new-post"
                className="h-8 w-full rounded border-0 px-2 text-sm shadow-sm ring-1 ring-stone-200 focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-600">Title</label>
              <input
                type="text"
                value={newPostTitle}
                onChange={(e) => setNewPostTitle(e.target.value)}
                placeholder="My New Post"
                className="h-8 w-full rounded border-0 px-2 text-sm shadow-sm ring-1 ring-stone-200 focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-600">Description</label>
              <input
                type="text"
                value={newPostDescription}
                onChange={(e) => setNewPostDescription(e.target.value)}
                placeholder="A description..."
                className="h-8 w-full rounded border-0 px-2 text-sm shadow-sm ring-1 ring-stone-200 focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-600">Tags</label>
              <input
                type="text"
                value={newPostTags}
                onChange={(e) => setNewPostTags(e.target.value)}
                placeholder="Tag1, Tag2"
                className="h-8 w-full rounded border-0 px-2 text-sm shadow-sm ring-1 ring-stone-200 focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-gray-500">Loading post...</div>
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
              selectedPost
                ? {
                    title: selectedPost.title,
                    published: selectedPost.published,
                    tags: selectedPost.tags,
                    description: selectedPost.description,
                  }
                : isCreatingNew
                  ? {
                      title: newPostTitle || "New Post",
                      published: new Date().toISOString().split("T")[0],
                      tags: newPostTags
                        .split(",")
                        .map((t) => t.trim())
                        .filter(Boolean),
                      description: newPostDescription,
                    }
                  : undefined
            }
          />
        ) : (
          <div className="min-h-full" style={{ backgroundColor: "var(--background)" }}>
            {/* Full preview with title and metadata, matching actual blog rendering */}
            <div className="mx-auto max-w-4xl px-6 py-8">
              {selectedPost && (
                <>
                  <h1 className="font-arizona-flare mb-4 text-4xl font-normal">{selectedPost.title}</h1>
                  {selectedPost.published && (
                    <div className="font-mallory-book mb-6 text-gray-600">{formatDate(selectedPost.published)}</div>
                  )}
                </>
              )}
              <div className="prose-content">
                <MDXPreview content={content} />
              </div>
              {selectedPost?.tags && selectedPost.tags.length > 0 && (
                <div className="font-mallory-book mt-8 text-gray-600">
                  <p>Tags: {selectedPost.tags.join(", ")}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

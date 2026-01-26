import { existsSync, readdirSync, readFileSync, statSync } from "fs";
import { Metadata } from "next";
import path from "path";

export interface Research {
  metadata: Metadata;
  content: string | null;
  slug: string;
  path: string[]; // Array of path segments for tree building
}

export interface ResearchTreeNode {
  name: string;
  slug: string | null; // null for folder-only nodes
  title: string | null;
  children: ResearchTreeNode[];
  lastUpdated: string | null;
}

const RESEARCH_BASE_PATH = "src/app/research";

/**
 * Recursively finds all research pages in a directory
 */
function findResearchPages(dir: string, basePath: string[] = []): string[][] {
  const results: string[][] = [];
  const fullPath = path.join(process.cwd(), RESEARCH_BASE_PATH, ...basePath, dir);

  if (!existsSync(fullPath) || !statSync(fullPath).isDirectory()) {
    return results;
  }

  const items = readdirSync(fullPath);

  // Check if this directory has a page.tsx and content.mdx (it's a research page)
  const hasPage = items.includes("page.tsx");
  const hasContent = items.includes("content.mdx");

  if (hasPage && hasContent) {
    results.push([...basePath, dir]);
  }

  // Recursively check subdirectories
  for (const item of items) {
    const itemPath = path.join(fullPath, item);
    if (statSync(itemPath).isDirectory() && !item.startsWith("[") && !item.startsWith(".")) {
      const subResults = findResearchPages(item, [...basePath, dir]);
      results.push(...subResults);
    }
  }

  return results;
}

/**
 * Get all research pages, optionally with content
 */
export async function GetAllResearch(withContent: boolean): Promise<Research[]> {
  const researchBasePath = path.join(process.cwd(), RESEARCH_BASE_PATH);

  if (!existsSync(researchBasePath)) {
    return [];
  }

  const topLevelDirs = readdirSync(researchBasePath).filter((item) => {
    const itemPath = path.join(researchBasePath, item);
    return statSync(itemPath).isDirectory() && !item.startsWith("[") && !item.startsWith(".");
  });

  const allPaths: string[][] = [];
  for (const dir of topLevelDirs) {
    const paths = findResearchPages(dir);
    allPaths.push(...paths);
  }

  const research: Research[] = [];
  for (const pathSegments of allPaths) {
    const slugPath = pathSegments.join("/");
    const item = await GetResearchByPath(slugPath, withContent);
    if (item) {
      research.push(item);
    }
  }

  // Sort by lastUpdated (most recent first)
  research.sort((a, b) => {
    const dateA = a.metadata.other?.lastUpdated ? new Date(String(a.metadata.other.lastUpdated)).getTime() : 0;
    const dateB = b.metadata.other?.lastUpdated ? new Date(String(b.metadata.other.lastUpdated)).getTime() : 0;
    return dateB - dateA;
  });

  return research;
}

/**
 * Get a single research page by its path
 */
export async function GetResearchByPath(slugPath: string, withContent: boolean): Promise<Research | null> {
  const segments = slugPath.split("/").filter(Boolean);
  const importPath = segments.join("/");

  try {
    const { metadata } = await import(`../app/research/${importPath}/page`);

    const research: Research = {
      metadata: {
        ...metadata,
      },
      content: null,
      slug: slugPath,
      path: segments,
    };

    if (withContent) {
      const contentPath = path.join(process.cwd(), RESEARCH_BASE_PATH, importPath, "content.mdx");
      if (existsSync(contentPath)) {
        const contentFile = readFileSync(contentPath);
        research.content = contentFile.toString("utf-8");
      }
    }

    return research;
  } catch {
    return null;
  }
}

/**
 * Build a tree structure from research pages for navigation
 */
export async function GetResearchTree(): Promise<ResearchTreeNode[]> {
  const allResearch = await GetAllResearch(false);

  const root: ResearchTreeNode[] = [];

  for (const item of allResearch) {
    const segments = item.path;
    let currentLevel = root;

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const isLast = i === segments.length - 1;

      let existing = currentLevel.find((node) => node.name === segment);

      if (!existing) {
        existing = {
          name: segment,
          slug: null,
          title: null,
          children: [],
          lastUpdated: null,
        };
        currentLevel.push(existing);
      }

      if (isLast) {
        // This is the actual research page
        existing.slug = item.slug;
        existing.title = item.metadata.title ? String(item.metadata.title) : segment;
        existing.lastUpdated = item.metadata.other?.lastUpdated ? String(item.metadata.other.lastUpdated) : null;
      }

      currentLevel = existing.children;
    }
  }

  // Sort children alphabetically at each level
  const sortTree = (nodes: ResearchTreeNode[]) => {
    nodes.sort((a, b) => a.name.localeCompare(b.name));
    for (const node of nodes) {
      sortTree(node.children);
    }
  };

  sortTree(root);

  return root;
}

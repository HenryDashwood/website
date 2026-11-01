import { existsSync, readdirSync, readFileSync, statSync } from "fs";
import GithubSlugger from "github-slugger";
import path from "path";
import { cache } from "react";

/**
 * Research notes live in `src/app/research/<topic>/.../<note>/content.mdx`.
 * Each note exports its metadata from the MDX file itself:
 *
 *   export const metadata = {
 *     title: "Flash Attention",
 *     description: "",
 *     created: "2026-01-27",
 *     lastUpdated: "2026-01-27",
 *     tags: ["AI"],
 *     log: [{ date: "2026-01-27", note: "First notes" }], // optional
 *   };
 *
 * Any folder that contains notes is a topic, served at its own URL and titled from its folder name.
 */

export const RESEARCH_BASE_PATH = "src/app/research";
const NOTE_FILE = "content.mdx";

export interface ResearchLogEntry {
  date: string;
  note: string;
}

export interface ResearchNoteMetadata {
  title: string;
  description?: string;
  created?: string;
  lastUpdated?: string;
  tags?: string[];
  log?: ResearchLogEntry[];
}

export interface ResearchNote {
  slug: string;
  path: string[];
  title: string;
  description: string | null;
  created: string | null;
  lastUpdated: string | null;
  tags: string[];
  /** Newest first */
  log: ResearchLogEntry[];
}

export interface ResearchTopic {
  slug: string;
  path: string[];
  title: string;
  /** Notes directly inside this topic, sorted by title */
  notes: ResearchNote[];
  /** Sub-topics, sorted by title */
  topics: ResearchTopic[];
  /** Number of notes in this topic and all its sub-topics */
  noteCount: number;
  /** Most recent lastUpdated of any note in this topic or its sub-topics */
  lastUpdated: string | null;
}

export interface ResearchHeading {
  depth: 2 | 3;
  text: string;
  id: string;
}

function absolute(...segments: string[]) {
  return path.join(process.cwd(), RESEARCH_BASE_PATH, ...segments);
}

function isContentDir(dir: string, name: string) {
  return !name.startsWith("[") && !name.startsWith(".") && statSync(path.join(dir, name)).isDirectory();
}

function listNotePaths(segments: string[] = []): string[][] {
  const dir = absolute(...segments);
  if (!existsSync(dir)) return [];

  const results: string[][] = [];
  if (segments.length > 0 && existsSync(path.join(dir, NOTE_FILE))) {
    results.push(segments);
  }
  for (const name of readdirSync(dir)) {
    if (isContentDir(dir, name)) {
      results.push(...listNotePaths([...segments, name]));
    }
  }
  return results;
}

/** "questions" -> "Questions", "big-bird" -> "Big Bird", "AI" -> "AI" */
export function humaniseSegment(segment: string) {
  return segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function optionalString(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

function toNote(segments: string[], metadata: Partial<ResearchNoteMetadata> | undefined): ResearchNote {
  const slug = segments.join("/");
  const log = Array.isArray(metadata?.log)
    ? [...metadata.log].filter((entry) => entry?.date && entry?.note).toSorted((a, b) => b.date.localeCompare(a.date))
    : [];

  return {
    slug,
    path: segments,
    title: optionalString(metadata?.title) ?? humaniseSegment(segments.at(-1) ?? slug),
    description: optionalString(metadata?.description),
    created: optionalString(metadata?.created),
    lastUpdated: optionalString(metadata?.lastUpdated) ?? optionalString(metadata?.created),
    tags: Array.isArray(metadata?.tags) ? metadata.tags.map(String) : [],
    log,
  };
}

async function loadNote(segments: string[]): Promise<ResearchNote | null> {
  const slug = segments.join("/");
  try {
    const mod = await import(`@/app/research/${slug}/content.mdx`);
    return toNote(segments, mod.metadata);
  } catch (error) {
    console.error(`Could not load research note ${slug}`, error);
    return null;
  }
}

/** All notes, most recently updated first. */
export const getAllNotes = cache(async (): Promise<ResearchNote[]> => {
  const notes = (await Promise.all(listNotePaths().map(loadNote))).filter((n): n is ResearchNote => n !== null);
  return notes.toSorted(
    (a, b) => (b.lastUpdated ?? "").localeCompare(a.lastUpdated ?? "") || a.title.localeCompare(b.title)
  );
});

export async function getNote(slug: string): Promise<ResearchNote | null> {
  const notes = await getAllNotes();
  return notes.find((n) => n.slug === slug) ?? null;
}

function byTitle<T extends { title: string }>(a: T, b: T) {
  return a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
}

async function buildTopic(segments: string[], notes: ResearchNote[]): Promise<ResearchTopic | null> {
  const depth = segments.length;
  const inside = notes.filter((n) => n.path.length > depth && segments.every((s, i) => n.path[i] === s));
  if (inside.length === 0) return null;

  const direct = inside.filter((n) => n.path.length === depth + 1);
  const directSlugs = new Set(direct.map((n) => n.slug));

  // Child folders that are not themselves notes become sub-topics
  const childNames = [...new Set(inside.filter((n) => n.path.length > depth + 1).map((n) => n.path[depth]))];
  const topics = (
    await Promise.all(
      childNames
        .filter((name) => !directSlugs.has([...segments, name].join("/")))
        .map((name) => buildTopic([...segments, name], notes))
    )
  ).filter((t): t is ResearchTopic => t !== null);

  return {
    slug: segments.join("/"),
    path: segments,
    title: depth > 0 ? humaniseSegment(segments.at(-1)!) : "Research",
    notes: direct.toSorted(byTitle),
    topics: topics.toSorted(byTitle),
    noteCount: inside.length,
    lastUpdated:
      inside
        .map((n) => n.lastUpdated ?? "")
        .toSorted()
        .at(-1) || null,
  };
}

/** The root topic: everything in the research section. */
export const getResearchRoot = cache(async (): Promise<ResearchTopic> => {
  const notes = await getAllNotes();
  return (
    (await buildTopic([], notes)) ?? {
      slug: "",
      path: [],
      title: "Research",
      notes: [],
      topics: [],
      noteCount: 0,
      lastUpdated: null,
    }
  );
});

export async function getTopic(slug: string): Promise<ResearchTopic | null> {
  const segments = slug.split("/").filter(Boolean);
  let topic: ResearchTopic | undefined = await getResearchRoot();
  for (let i = 0; i < segments.length && topic; i++) {
    const prefix = segments.slice(0, i + 1).join("/");
    topic = topic.topics.find((t) => t.slug === prefix);
  }
  return topic ?? null;
}

/** Every topic below the root, depth first. */
export async function getAllTopics(): Promise<ResearchTopic[]> {
  const walk = (topic: ResearchTopic): ResearchTopic[] => topic.topics.flatMap((t) => [t, ...walk(t)]);
  return walk(await getResearchRoot());
}

/** Notes nested directly beneath a note (when a note folder also holds other notes). */
export async function getChildNotes(slug: string): Promise<ResearchNote[]> {
  const notes = await getAllNotes();
  const depth = slug.split("/").length;
  return notes.filter((n) => n.path.length === depth + 1 && n.slug.startsWith(`${slug}/`)).toSorted(byTitle);
}

export interface ResearchNavNode {
  slug: string;
  title: string;
  /** A note has a page of its own; a folder is a topic made of the notes inside it */
  kind: "note" | "folder";
  /** Number of notes beneath this node */
  count: number;
  lastUpdated: string | null;
  children: ResearchNavNode[];
}

function buildNav(prefix: string[], notes: ResearchNote[], bySlug: Map<string, ResearchNote>): ResearchNavNode[] {
  const depth = prefix.length;
  const under = notes.filter((n) => n.path.length > depth && prefix.every((s, i) => n.path[i] === s));
  const names = [...new Set(under.map((n) => n.path[depth]))];

  const nodes = names.map((name): ResearchNavNode => {
    const nodePath = [...prefix, name];
    const slug = nodePath.join("/");
    const note = bySlug.get(slug);
    const children = buildNav(nodePath, under, bySlug);
    const below = under.filter((n) => n.path.length > nodePath.length && n.slug.startsWith(`${slug}/`));
    return {
      slug,
      title: note?.title ?? humaniseSegment(name),
      kind: note ? "note" : "folder",
      count: below.length,
      lastUpdated:
        [note, ...below]
          .map((n) => n?.lastUpdated ?? "")
          .toSorted()
          .at(-1) || null,
      children,
    };
  });

  // Folders first, then notes, each alphabetically
  return nodes.toSorted(
    (a, b) =>
      Number(a.kind === "note") - Number(b.kind === "note") ||
      a.title.localeCompare(b.title, undefined, { sensitivity: "base" })
  );
}

/** The whole research hierarchy, for the tree navigation and outlines. */
export const getResearchNav = cache(async (): Promise<ResearchNavNode[]> => {
  const notes = await getAllNotes();
  return buildNav([], notes, new Map(notes.map((n) => [n.slug, n])));
});

/** The nav subtree beneath a folder or note, or null if there is no such node. */
export async function getNavNode(slug: string): Promise<ResearchNavNode | null> {
  let nodes = await getResearchNav();
  let found: ResearchNavNode | null = null;
  const segments = slug.split("/").filter(Boolean);
  for (let i = 0; i < segments.length; i++) {
    const prefix = segments.slice(0, i + 1).join("/");
    found = nodes.find((n) => n.slug === prefix) ?? null;
    if (!found) return null;
    nodes = found.children;
  }
  return found;
}

export function readNoteSource(slug: string): string {
  const file = absolute(...slug.split("/"), NOTE_FILE);
  return existsSync(file) ? readFileSync(file, "utf-8") : "";
}

const RESEARCH_LINK = /(?:\]\(|href=["'{]+)\/research\/([^)\s"'#?}]+)/g;

/** Map of note slug -> slugs of notes that link to it. */
export const getBacklinkIndex = cache(async (): Promise<Map<string, string[]>> => {
  const notes = await getAllNotes();
  const known = new Set(notes.map((n) => n.slug));
  const index = new Map<string, string[]>();

  for (const note of notes) {
    const targets = new Set<string>();
    for (const match of readNoteSource(note.slug).matchAll(RESEARCH_LINK)) {
      const target = match[1].replace(/\/+$/, "");
      if (target !== note.slug && known.has(target)) targets.add(target);
    }
    for (const target of targets) {
      index.set(target, [...(index.get(target) ?? []), note.slug]);
    }
  }
  return index;
});

export async function getBacklinks(slug: string): Promise<ResearchNote[]> {
  const [index, notes] = await Promise.all([getBacklinkIndex(), getAllNotes()]);
  const sources = new Set(index.get(slug) ?? []);
  return notes.filter((n) => sources.has(n.slug)).toSorted(byTitle);
}

function plainHeadingText(markdown: string) {
  return markdown
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/\$([^$]*)\$/g, "$1")
    .replace(/(\*\*|__|\*|_)(.*?)\1/g, "$2")
    .replace(/<[^>]+>/g, "")
    .trim();
}

/**
 * h2 and h3 headings of a note, with the ids rehype-slug gives them.
 * All heading levels go through the slugger so duplicate ids are numbered the same way.
 */
export function getHeadings(slug: string): ResearchHeading[] {
  const slugger = new GithubSlugger();
  const headings: ResearchHeading[] = [];
  let fence: string | null = null;

  for (const line of readNoteSource(slug).split("\n")) {
    const fenceMatch = line.match(/^\s*(```|~~~)/);
    if (fenceMatch) {
      fence = fence === null ? fenceMatch[1] : fence === fenceMatch[1] ? null : fence;
      continue;
    }
    if (fence) continue;

    const match = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (!match) continue;
    const text = plainHeadingText(match[2]);
    const id = slugger.slug(text);
    const depth = match[1].length;
    if (depth === 2 || depth === 3) headings.push({ depth, text, id });
  }
  return headings;
}

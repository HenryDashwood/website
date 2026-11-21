# AGENTS.md

This file provides guidance to coding agents when working with code in this repository.

# Linting and formatting

Linting uses [oxlint](https://oxc.rs/docs/guide/usage/linter) (config in `.oxlintrc.json`) and formatting uses Bun's built-in [`bun fmt`](https://bun.com/docs/format) (config in the `[fmt]` section of `bunfig.toml`). Neither ESLint nor Prettier is used.

```bash
# Lint (with autofix)
bun run lint

# Format code
bun run format

# Check formatting
bun run format:check
```

## Architecture Overview

This is a Next.js 16 personal website built with the App Router, TypeScript, and MDX for blog posts. The project uses Bun as the package manager and runtime.

### Content Management System

Posts are file-based and follow a specific structure:

- Each post lives in `src/app/posts/[slug]/`
- Each post directory contains:
  - `page.tsx` - exports post metadata (title, description, published date, tags, slug)
  - `post.mdx` - the actual post content

Post metadata is defined in `page.tsx` using Next.js Metadata API:

```typescript
export const metadata: Metadata = {
  title: "Post Title",
  description: "Post description",
  openGraph: {
    images: [{ url: `${process.env.WEBSITE_URL}/api/og?title=...` }],
  },
  other: {
    slug: "post-slug",
    published: "YYYY-MM-DD",
    tags: ["Tag1", "Tag2"],
  },
};
```

The `src/lib/posts.ts` module provides:

- `GetPosts(withContent: boolean)` - fetches all posts, sorted by published date (newest first)
- `GetPost(slug: string, withContent: boolean)` - fetches a single post by slug

### MDX Configuration

MDX is configured in `next.config.mjs` with the following plugins:

- `remark-gfm` - GitHub Flavored Markdown
- `remark-math` - Maths notation support
- `rehype-katex` - KaTeX math rendering (requires importing `katex/dist/katex.min.css` in layout)
- `rehype-pretty-code` - Code syntax highlighting with Shiki

### Styling

The site uses Tailwind CSS with custom fonts:

- Arizona Flare (display font, headings)
- Source Serif 4 (body text, from Google Fonts)
- Mallory Book (sans-serif for UI, tables, asides)
- JetBrains Mono (code, from Google Fonts)

Local font files are in `src/app/assets/` and loaded via `next/font/local`; Google fonts via `next/font/google`, both in `src/app/layout.tsx`.

Custom Tailwind classes are defined in `tailwind.config.ts`:

- Font families: `font-source-serif`, `font-arizona-flare`, `font-mallory-book`, `font-code`
- Custom color: `navBackground` (#faad19)

Typography plugin from `@tailwindcss/typography` is enabled for prose styling.

### Component Architecture

Shared reusable components live in `src/components/`:

- `PostPage` - Wrapper component that dynamically imports and renders MDX content for a post
- `NavContentWrapper` - Layout wrapper for navigation and content
- `Content` - Content container component
- `Date` - Formats and displays dates consistently
- `Nav` - Navigation component
- `LocalImage` - Image wrapper components (`LocalImage`, `LocalImageGrid`, `LocalImageSideBySide`)
- `viz.tsx` - Shared interactive chart/diagram primitives (`Axes`, `Chart`, `Figure`, `Slider`, etc.)

Components specific to a single post or research note are colocated inside that post's or note's folder (as sibling files or in a `_components/` subfolder). Promote a component to `src/components/` only when a second post or note uses it.

### Media

- Site-wide assets (headshot, social icons) live in `public/images/`.
- Post media lives in `public/media/posts/<slug>/` (referenced as `/media/posts/<slug>/<file>`).
- Research note media lives in `public/media/research/<note-path>/` (referenced as `/media/research/<note-path>/<file>`).

### RSS Feed

RSS feed is generated at `/feed.xml` via `src/app/feed.xml/route.ts` and `src/lib/feedHtml.ts`:

- Parses MDX via `unified` + `remark-mdx` + `remark-gfm` + `remark-math`
- Renders maths to standalone MathML via `rehype-katex` (`output: "mathml"`)
- Unpacks `LocalImage`, `LocalImageGrid`, `LocalImageSideBySide`, and `Image` into `<figure>`/`<figcaption>` with absolute URLs
- Replaces interactive React components with a link back to the post (or an optional `feedLabel` / `feedImage`)
- Sanitizes HTML with `sanitize-html` and puts the post's short `description` in `<description>` and full HTML in `<content:encoded>`
- Uses `rss` package to generate the XML feed

### Environment Variables

Required in `.env`:

- `WEBSITE_URL` - Base URL for the site (used in metadata, RSS, OpenGraph)

### Path Aliases

TypeScript is configured with `@/*` alias pointing to `src/*` directory.

## Working with Posts

To create a new post:

1. Create directory: `src/app/posts/[slug]/`
2. Create `page.tsx` with metadata export
3. Create `post.mdx` with content
4. Ensure `metadata.other` includes: `slug`, `published` (YYYY-MM-DD format), and `tags` array

Posts automatically appear in the posts list and RSS feed once created.

## Working with Research notes

Research notes are evolving notes, distinct from blog posts. They live in `src/app/research/<topic>/.../<note>/content.mdx`, one file per note, served by `src/app/research/[...slug]/page.tsx`. Metadata is exported from the MDX file itself:

```js
export const metadata = {
  title: "Flash Attention",
  description: "",
  created: "2026-01-27",
  tags: ["AI"],
  log: [{ date: "2026-01-27", note: "First notes" }], // optional, shown on the note
};
```

- `bun run new:research <path> [title]` scaffolds a note.
- Put note-specific components in the note's folder (alongside `content.mdx` or in `_components/`).
- Put note media (images, audio, etc.) in `public/media/research/<path>/`.
- Every folder that contains notes gets a topic page at its URL, titled from the folder name, showing its whole subtree as an outline.
- `src/app/research/layout.tsx` renders the site nav, the collapsible research tree (`src/components/ResearchTree`, built from `getResearchNav()`), and the content. Research pages render content only, not `NavContentWrapper`.
- `src/lib/research.ts` builds the notes, topic tree, backlinks (from `/research/...` links in MDX) and headings.

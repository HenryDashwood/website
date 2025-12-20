# AGENTS.md

This file provides guidance to coding agents when working with code in this repository.

# Linting

````bash
bun run lint

# Format code

```bash
bun run format
````

# Check formatting

```bash
bun run format:check
```

## Architecture Overview

This is a Next.js 14 personal website built with the App Router, TypeScript, and MDX for blog posts. The project uses Bun as the package manager and runtime.

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
- `remark-math` - Math notation support
- `rehype-katex` - KaTeX math rendering (requires importing `katex/dist/katex.min.css` in layout)
- `rehype-highlight` - Code syntax highlighting with highlight.js

### Styling

The site uses Tailwind CSS with custom fonts:

- Arizona Flare (display font)
- Martina Plantijn (serif font)
- Mallory Book (sans-serif font)

Font files are located in `src/app/assets/` and loaded via `next/font/local` in `src/app/layout.tsx`.

Custom Tailwind classes are defined in `tailwind.config.ts`:

- Font families: `font-martinaPlantijn`, `font-arizonaFlare`, `font-malloryBook`
- Custom color: `navBackground` (#faad19)

Typography plugin from `@tailwindcss/typography` is enabled for prose styling.

### Component Architecture

Key reusable components in `src/components/`:

- `PostPage` - Wrapper component that dynamically imports and renders MDX content for a post
- `NavContentWrapper` - Layout wrapper for navigation and content
- `Content` - Content container component
- `Date` - Formats and displays dates consistently
- `Nav` - Navigation component
- `LinkBox` / `LinkBoxContainer` - UI components for link displays

### RSS Feed

RSS feed is generated dynamically at `/feed.xml` via `src/app/feed.xml/route.ts`:

- Converts MDX to HTML using `marked`
- Sanitizes HTML with `sanitize-html`
- Handles Next.js Image component by converting to standard `<img>` tags
- Uses `rss` package to generate XML feed

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

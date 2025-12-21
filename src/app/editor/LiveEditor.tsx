"use client";

import { redo, undo } from "@codemirror/commands";
import { markdown } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { EditorState, Range, RangeSetBuilder, StateField } from "@codemirror/state";
import { Decoration, DecorationSet, EditorView, WidgetType } from "@codemirror/view";
import CodeMirror, { ReactCodeMirrorRef } from "@uiw/react-codemirror";
import hljs from "highlight.js";
import katex from "katex";
import { useCallback, useEffect, useRef } from "react";

// Export interface for parent component to call editor actions
export interface EditorActions {
  undo: () => boolean;
  redo: () => boolean;
  insertText: (text: string) => void;
}

interface PostMetadata {
  title: string;
  published: string | null;
  tags: string[];
  description?: string;
}

interface LiveEditorProps {
  content: string;
  onChange: (value: string) => void;
  metadata?: PostMetadata;
  postKey?: string; // Used to force remount when switching posts
  onReady?: (actions: EditorActions) => void; // Callback to provide undo/redo methods to parent
}

// Widget for rendering inline math
class InlineMathWidget extends WidgetType {
  constructor(readonly math: string) {
    super();
  }

  toDOM() {
    const span = document.createElement("span");
    span.className = "inline-math-widget";

    try {
      katex.render(this.math, span, {
        displayMode: false,
        throwOnError: false,
      });
    } catch {
      span.textContent = `$${this.math}$`;
      span.className += " text-red-500";
    }

    return span;
  }

  ignoreEvent() {
    return false;
  }
}

// Widget for rendering block math
class BlockMathWidget extends WidgetType {
  constructor(readonly math: string) {
    super();
  }

  eq(other: BlockMathWidget) {
    return other.math === this.math;
  }

  toDOM() {
    const div = document.createElement("span");
    div.className = "block-math-widget";

    try {
      katex.render(this.math, div, {
        displayMode: true,
        throwOnError: false,
      });
    } catch {
      div.textContent = this.math;
      div.className += " text-red-500 font-mono text-sm";
    }

    return div;
  }

  ignoreEvent() {
    return false;
  }
}

// Widget for rendering images
class ImageWidget extends WidgetType {
  constructor(
    readonly src: string,
    readonly alt: string,
    readonly caption?: string
  ) {
    super();
  }

  eq(other: ImageWidget) {
    return other.src === this.src && other.alt === this.alt && other.caption === this.caption;
  }

  toDOM() {
    const container = document.createElement("span");
    container.className = "image-widget";

    const img = document.createElement("img");
    img.src = this.src;
    img.alt = this.alt;
    img.className = "max-w-lg rounded-lg shadow-lg";
    img.onerror = () => {
      img.style.display = "none";
      const placeholder = document.createElement("span");
      placeholder.className = "inline-block bg-gray-200 p-4 rounded text-gray-500 text-sm";
      placeholder.textContent = `Image: ${this.src}`;
      container.appendChild(placeholder);
    };
    container.appendChild(img);

    if (this.caption) {
      const captionEl = document.createElement("span");
      captionEl.className = "block mt-2 text-sm text-gray-600 italic text-center";
      captionEl.textContent = this.caption;
      container.appendChild(captionEl);
    }

    return container;
  }

  ignoreEvent() {
    return false;
  }
}

// Widget for details blocks
class DetailsWidget extends WidgetType {
  constructor(
    readonly summary: string,
    readonly content: string
  ) {
    super();
  }

  eq(other: DetailsWidget) {
    return other.summary === this.summary && other.content === this.content;
  }

  toDOM() {
    const details = document.createElement("details");
    details.className = "details-widget";

    const summary = document.createElement("summary");
    summary.className = "font-bold cursor-pointer";
    summary.textContent = this.summary;
    details.appendChild(summary);

    const content = document.createElement("div");
    content.className = "mt-2 prose-sm";
    let processedContent = this.content;

    // Handle block math
    processedContent = processedContent.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
      const tempDiv = document.createElement("div");
      try {
        katex.render(math.trim(), tempDiv, { displayMode: true, throwOnError: false });
        return `<div class="my-2 text-center overflow-x-auto">${tempDiv.innerHTML}</div>`;
      } catch {
        return `<pre class="text-red-500">${math}</pre>`;
      }
    });

    // Handle inline math
    processedContent = processedContent.replace(/\$([^$\n]+)\$/g, (_, math) => {
      const tempSpan = document.createElement("span");
      try {
        katex.render(math, tempSpan, { displayMode: false, throwOnError: false });
        return tempSpan.innerHTML;
      } catch {
        return `<code>${math}</code>`;
      }
    });

    // Convert newlines to paragraphs
    processedContent = processedContent
      .split(/\n\n+/)
      .map((p) => `<p>${p.trim()}</p>`)
      .join("");

    content.innerHTML = processedContent;
    details.appendChild(content);

    return details;
  }

  // Return false to allow clicking to edit
  ignoreEvent() {
    return false;
  }
}

// Widget for rendering markdown links
class LinkWidget extends WidgetType {
  constructor(
    readonly text: string,
    readonly href: string
  ) {
    super();
  }

  eq(other: LinkWidget) {
    return other.text === this.text && other.href === this.href;
  }

  toDOM() {
    const link = document.createElement("a");
    link.href = this.href;
    link.textContent = this.text;
    link.className = "link-widget text-blue-600 hover:underline cursor-pointer";
    // Prevent navigation when clicking in editor
    link.addEventListener("click", (e) => {
      e.preventDefault();
    });
    return link;
  }

  ignoreEvent() {
    return false;
  }
}

// Widget for rendering tables
class TableWidget extends WidgetType {
  constructor(readonly tableHtml: string) {
    super();
  }

  eq(other: TableWidget) {
    return other.tableHtml === this.tableHtml;
  }

  toDOM() {
    const wrapper = document.createElement("div");
    wrapper.className = "table-widget overflow-x-auto my-4";
    wrapper.innerHTML = this.tableHtml;
    return wrapper;
  }

  ignoreEvent() {
    return false;
  }
}

// Widget for headings
class HeadingWidget extends WidgetType {
  constructor(
    readonly level: number,
    readonly text: string
  ) {
    super();
  }

  eq(other: HeadingWidget) {
    return other.level === this.level && other.text === this.text;
  }

  toDOM() {
    const heading = document.createElement(`h${this.level}`) as HTMLHeadingElement;
    heading.className = `heading-widget heading-${this.level}`;
    heading.textContent = this.text;
    return heading;
  }

  ignoreEvent() {
    return false;
  }
}

// Widget for bold text
class BoldWidget extends WidgetType {
  constructor(readonly text: string) {
    super();
  }

  eq(other: BoldWidget) {
    return other.text === this.text;
  }

  toDOM() {
    const strong = document.createElement("strong");
    strong.className = "bold-widget";
    strong.textContent = this.text;
    return strong;
  }

  ignoreEvent() {
    return false;
  }
}

// Widget for italic text
class ItalicWidget extends WidgetType {
  constructor(readonly text: string) {
    super();
  }

  eq(other: ItalicWidget) {
    return other.text === this.text;
  }

  toDOM() {
    const em = document.createElement("em");
    em.className = "italic-widget";
    em.textContent = this.text;
    return em;
  }

  ignoreEvent() {
    return false;
  }
}

// Widget for bold+italic text (e.g., **_text_** or ***text***)
class BoldItalicWidget extends WidgetType {
  constructor(readonly text: string) {
    super();
  }

  eq(other: BoldItalicWidget) {
    return other.text === this.text;
  }

  toDOM() {
    const strong = document.createElement("strong");
    const em = document.createElement("em");
    em.className = "bold-italic-widget";
    em.textContent = this.text;
    strong.appendChild(em);
    return strong;
  }

  ignoreEvent() {
    return false;
  }
}

// Widget for inline code
class InlineCodeWidget extends WidgetType {
  constructor(readonly code: string) {
    super();
  }

  eq(other: InlineCodeWidget) {
    return other.code === this.code;
  }

  toDOM() {
    const code = document.createElement("code");
    code.className = "inline-code-widget";
    code.textContent = this.code;
    return code;
  }

  ignoreEvent() {
    return false;
  }
}

// Widget for fenced code blocks with syntax highlighting
class CodeBlockWidget extends WidgetType {
  constructor(
    readonly code: string,
    readonly language: string
  ) {
    super();
  }

  eq(other: CodeBlockWidget) {
    return other.code === this.code && other.language === this.language;
  }

  toDOM() {
    const pre = document.createElement("pre");

    const code = document.createElement("code");
    code.className = this.language ? `hljs language-${this.language}` : "hljs";

    // Use highlight.js for syntax highlighting
    if (this.language && hljs.getLanguage(this.language)) {
      try {
        code.innerHTML = hljs.highlight(this.code, { language: this.language }).value;
      } catch {
        code.textContent = this.code;
      }
    } else if (this.language) {
      // Try auto-detection if language not recognized
      try {
        code.innerHTML = hljs.highlightAuto(this.code).value;
      } catch {
        code.textContent = this.code;
      }
    } else {
      code.textContent = this.code;
    }

    pre.appendChild(code);
    return pre;
  }

  ignoreEvent() {
    return false;
  }
}

// Find inline math
function findInlineMath(
  text: string,
  cursorFrom: number,
  cursorTo: number
): { from: number; to: number; math: string }[] {
  const results: { from: number; to: number; math: string }[] = [];

  const regex = /(?<!\$)\$(?!\$)([^\$\n]+?)\$(?!\$)/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const from = match.index;
    const to = from + match[0].length;
    if (cursorFrom <= to && cursorTo >= from) continue;
    results.push({ from, to, math: match[1] });
  }

  return results;
}

// Find block math
function findBlockMath(
  text: string,
  cursorFrom: number,
  cursorTo: number
): { from: number; to: number; math: string }[] {
  const results: { from: number; to: number; math: string }[] = [];

  const regex = /\$\$[ \t]*\n([\s\S]*?)\n[ \t]*\$\$/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const from = match.index;
    const to = from + match[0].length;
    if (cursorFrom <= to && cursorTo >= from) continue;
    results.push({ from, to, math: match[1].trim() });
  }

  return results;
}

// Find LocalImage components
function findImages(
  text: string,
  cursorFrom: number,
  cursorTo: number
): { from: number; to: number; src: string; alt: string; caption?: string }[] {
  const results: { from: number; to: number; src: string; alt: string; caption?: string }[] = [];

  const regex = /<LocalImage[\s\S]*?\/>/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const from = match.index;
    const to = from + match[0].length;
    if (cursorFrom <= to && cursorTo >= from) continue;

    const content = match[0];
    const srcMatch = content.match(/src=["']([^"']+)["']/);
    const altMatch = content.match(/alt=["']([^"']+)["']/);
    const captionMatch = content.match(/caption=["']([^"']+)["']/);

    if (srcMatch) {
      results.push({
        from,
        to,
        src: srcMatch[1],
        alt: altMatch?.[1] || "",
        caption: captionMatch?.[1],
      });
    }
  }

  return results;
}

// Find details blocks
function findDetails(
  text: string,
  cursorFrom: number,
  cursorTo: number
): { from: number; to: number; summary: string; content: string }[] {
  const results: { from: number; to: number; summary: string; content: string }[] = [];

  const regex = /<details>[\s\S]*?<summary>([\s\S]*?)<\/summary>([\s\S]*?)<\/details>/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const from = match.index;
    const to = from + match[0].length;
    if (cursorFrom <= to && cursorTo >= from) continue;
    results.push({
      from,
      to,
      summary: match[1].trim(),
      content: match[2].trim(),
    });
  }

  return results;
}

// Find markdown links [text](url)
function findLinks(
  text: string,
  cursorFrom: number,
  cursorTo: number
): { from: number; to: number; linkText: string; href: string }[] {
  const results: { from: number; to: number; linkText: string; href: string }[] = [];

  // Match [text](url) but not ![text](url) (images)
  const regex = /(?<!!)\[([^\]]+)\]\(([^)]+)\)/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const from = match.index;
    const to = from + match[0].length;
    if (cursorFrom <= to && cursorTo >= from) continue;
    results.push({
      from,
      to,
      linkText: match[1],
      href: match[2],
    });
  }

  return results;
}

// Find markdown tables
function findTables(
  text: string,
  cursorFrom: number,
  cursorTo: number
): { from: number; to: number; tableHtml: string }[] {
  const results: { from: number; to: number; tableHtml: string }[] = [];

  // Match markdown tables (header row, separator row, data rows)
  const tableRegex = /(?:^|\n)(\|[^\n]+\|\n\|[-:\s|]+\|\n(?:\|[^\n]+\|\n?)+)/g;
  let match;
  while ((match = tableRegex.exec(text)) !== null) {
    const from = match.index + (text[match.index] === "\n" ? 1 : 0);
    const to = from + match[1].length;
    if (cursorFrom <= to && cursorTo >= from) continue;

    // Parse markdown table to HTML
    const lines = match[1].trim().split("\n");
    if (lines.length < 2) continue;

    // Split by | and remove first/last empty elements from leading/trailing pipes
    // Keep empty cells in between (don't filter them out)
    const parseCells = (line: string) => {
      const parts = line.split("|");
      // Remove first element if empty (from leading |)
      if (parts.length > 0 && parts[0].trim() === "") parts.shift();
      // Remove last element if empty (from trailing |)
      if (parts.length > 0 && parts[parts.length - 1].trim() === "") parts.pop();
      return parts.map((c) => c.trim());
    };

    // Process inline markdown formatting within a cell
    const formatCell = (cell: string): string => {
      if (!cell) return "&nbsp;";
      let formatted = cell;
      // Escape HTML first
      formatted = formatted.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      // Bold+italic (***text*** or ___text___)
      formatted = formatted.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
      formatted = formatted.replace(/___(.+?)___/g, "<strong><em>$1</em></strong>");
      // Bold (**text** or __text__)
      formatted = formatted.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
      formatted = formatted.replace(/__(.+?)__/g, "<strong>$1</strong>");
      // Italic (*text* or _text_)
      formatted = formatted.replace(/\*([^*]+?)\*/g, "<em>$1</em>");
      formatted = formatted.replace(/_([^_]+?)_/g, "<em>$1</em>");
      // Inline code (`code`)
      formatted = formatted.replace(/`([^`]+?)`/g, '<code class="bg-gray-200 px-1 rounded">$1</code>');
      // Links [text](url)
      formatted = formatted.replace(
        /\[([^\]]+?)\]\(([^)]+?)\)/g,
        '<a href="$2" class="text-blue-600 underline">$1</a>'
      );
      return formatted;
    };

    const headerCells = parseCells(lines[0]);
    const alignments = parseCells(lines[1]).map((cell) => {
      if (cell.startsWith(":") && cell.endsWith(":")) return "center";
      if (cell.endsWith(":")) return "right";
      return "left";
    });

    let tableHtml = '<table class="min-w-full border-collapse border border-gray-300">';
    tableHtml += "<thead><tr>";
    headerCells.forEach((cell, i) => {
      tableHtml += `<th class="border border-gray-300 px-4 py-2 bg-gray-100 font-bold text-${alignments[i] || "left"}">${formatCell(cell)}</th>`;
    });
    tableHtml += "</tr></thead><tbody>";

    for (let i = 2; i < lines.length; i++) {
      const cells = parseCells(lines[i]);
      tableHtml += "<tr>";
      cells.forEach((cell, j) => {
        tableHtml += `<td class="border border-gray-300 px-4 py-2 text-${alignments[j] || "left"}">${formatCell(cell)}</td>`;
      });
      tableHtml += "</tr>";
    }

    tableHtml += "</tbody></table>";

    results.push({ from, to, tableHtml });
  }

  return results;
}

// Find headings (## Heading, ### Heading, etc.)
function findHeadings(
  text: string,
  cursorFrom: number,
  cursorTo: number
): { from: number; to: number; level: number; text: string }[] {
  const results: { from: number; to: number; level: number; text: string }[] = [];

  // Match headings at start of line
  const regex = /^(#{1,6})\s+(.+)$/gm;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const from = match.index;
    const to = from + match[0].length;
    if (cursorFrom <= to && cursorTo >= from) continue;
    results.push({
      from,
      to,
      level: match[1].length,
      text: match[2],
    });
  }

  return results;
}

// Find bold text (**text** or __text__)
// Find bold+italic text (**_text_**, ***text***, etc.)
function findBoldItalic(
  text: string,
  cursorFrom: number,
  cursorTo: number
): { from: number; to: number; text: string }[] {
  const results: { from: number; to: number; text: string }[] = [];

  // Match **_text_** or __*text*__
  const mixedRegex = /(\*\*_|__\*)(.+?)(_\*\*|\*__)/g;
  let match;
  while ((match = mixedRegex.exec(text)) !== null) {
    const from = match.index;
    const to = from + match[0].length;
    if (cursorFrom <= to && cursorTo >= from) continue;
    results.push({ from, to, text: match[2] });
  }

  // Match ***text*** or ___text___
  const tripleRegex = /(\*\*\*|___)(.+?)\1/g;
  while ((match = tripleRegex.exec(text)) !== null) {
    const from = match.index;
    const to = from + match[0].length;
    if (cursorFrom <= to && cursorTo >= from) continue;
    results.push({ from, to, text: match[2] });
  }

  return results;
}

function findBold(text: string, cursorFrom: number, cursorTo: number): { from: number; to: number; text: string }[] {
  const results: { from: number; to: number; text: string }[] = [];

  // Match **text** or __text__ but NOT ***text*** or **_text_**
  const regex = /(?<!\*)(\*\*)(?!\*)(?!_)([^*_]+?)(?<!_)(?<!\*)\1(?!\*)/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const from = match.index;
    const to = from + match[0].length;
    if (cursorFrom <= to && cursorTo >= from) continue;
    results.push({
      from,
      to,
      text: match[2],
    });
  }

  // Also match __text__ but not ___text___ or __*text*__
  const underscoreRegex = /(?<!_)(__)(?!_)(?!\*)([^*_]+?)(?<!\*)(?<!_)\1(?!_)/g;
  while ((match = underscoreRegex.exec(text)) !== null) {
    const from = match.index;
    const to = from + match[0].length;
    if (cursorFrom <= to && cursorTo >= from) continue;
    results.push({
      from,
      to,
      text: match[2],
    });
  }

  return results;
}

// Find italic text (*text* or _text_)
function findItalic(text: string, cursorFrom: number, cursorTo: number): { from: number; to: number; text: string }[] {
  const results: { from: number; to: number; text: string }[] = [];

  // Match *text* or _text_ but not ** or __
  const regex = /(?<!\*)\*(?!\*)([^*\n]+?)(?<!\*)\*(?!\*)|(?<!_)_(?!_)([^_\n]+?)(?<!_)_(?!_)/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const from = match.index;
    const to = from + match[0].length;
    if (cursorFrom <= to && cursorTo >= from) continue;
    results.push({
      from,
      to,
      text: match[1] || match[2],
    });
  }

  return results;
}

// Find inline code (`code`)
function findInlineCode(
  text: string,
  cursorFrom: number,
  cursorTo: number
): { from: number; to: number; code: string }[] {
  const results: { from: number; to: number; code: string }[] = [];

  // Match `code` but not ```code blocks
  const regex = /(?<!`)`(?!`)([^`\n]+?)`(?!`)/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const from = match.index;
    const to = from + match[0].length;
    if (cursorFrom <= to && cursorTo >= from) continue;
    results.push({
      from,
      to,
      code: match[1],
    });
  }

  return results;
}

// Find fenced code blocks
function findCodeBlocks(
  text: string,
  cursorFrom: number,
  cursorTo: number
): { from: number; to: number; code: string; language: string }[] {
  const results: { from: number; to: number; code: string; language: string }[] = [];

  // Match ```language\ncode\n``` - fenced code blocks
  const regex = /```(\w*)\n([\s\S]*?)\n```/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const from = match.index;
    const to = from + match[0].length;
    if (cursorFrom <= to && cursorTo >= from) continue;
    results.push({
      from,
      to,
      language: match[1] || "",
      code: match[2],
    });
  }

  return results;
}

// Build decorations from state
function buildDecorations(state: EditorState): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  const text = state.doc.toString();
  const selection = state.selection.main;
  const cursorFrom = selection.from;
  const cursorTo = selection.to;

  // Collect all decorations
  const decorations: Range<Decoration>[] = [];

  // Block-level elements first (to avoid conflicts)

  // Block math
  const blockMath = findBlockMath(text, cursorFrom, cursorTo);
  for (const m of blockMath) {
    decorations.push(
      Decoration.replace({
        widget: new BlockMathWidget(m.math),
      }).range(m.from, m.to)
    );
  }

  // Details
  const details = findDetails(text, cursorFrom, cursorTo);
  for (const d of details) {
    decorations.push(
      Decoration.replace({
        widget: new DetailsWidget(d.summary, d.content),
      }).range(d.from, d.to)
    );
  }

  // Tables
  const tables = findTables(text, cursorFrom, cursorTo);
  for (const table of tables) {
    decorations.push(
      Decoration.replace({
        widget: new TableWidget(table.tableHtml),
      }).range(table.from, table.to)
    );
  }

  // Code blocks
  const codeBlocks = findCodeBlocks(text, cursorFrom, cursorTo);
  for (const block of codeBlocks) {
    decorations.push(
      Decoration.replace({
        widget: new CodeBlockWidget(block.code, block.language),
      }).range(block.from, block.to)
    );
  }

  // Images
  const images = findImages(text, cursorFrom, cursorTo);
  for (const img of images) {
    decorations.push(
      Decoration.replace({
        widget: new ImageWidget(img.src, img.alt, img.caption),
      }).range(img.from, img.to)
    );
  }

  // Headings
  const headings = findHeadings(text, cursorFrom, cursorTo);
  for (const h of headings) {
    decorations.push(
      Decoration.replace({
        widget: new HeadingWidget(h.level, h.text),
      }).range(h.from, h.to)
    );
  }

  // Get ranges already covered by block elements
  const coveredRanges: { from: number; to: number }[] = decorations.map((d) => ({ from: d.from, to: d.to }));

  // Helper to check if a range overlaps with any covered range
  const isInCoveredRange = (from: number, to: number) =>
    coveredRanges.some(
      (r) => (from >= r.from && from < r.to) || (to > r.from && to <= r.to) || (from <= r.from && to >= r.to)
    );

  // Helper to add a range to covered
  const addToCovered = (from: number, to: number) => {
    coveredRanges.push({ from, to });
  };

  // Inline elements (check they don't overlap with block elements)

  // Inline math - process first so underscores inside math don't get caught by italic
  const inlineMath = findInlineMath(text, cursorFrom, cursorTo);
  for (const m of inlineMath) {
    if (!isInCoveredRange(m.from, m.to)) {
      decorations.push(
        Decoration.replace({
          widget: new InlineMathWidget(m.math),
        }).range(m.from, m.to)
      );
      addToCovered(m.from, m.to);
    }
  }

  // Inline code - process before other formatting
  const inlineCodes = findInlineCode(text, cursorFrom, cursorTo);
  for (const c of inlineCodes) {
    if (!isInCoveredRange(c.from, c.to)) {
      decorations.push(
        Decoration.replace({
          widget: new InlineCodeWidget(c.code),
        }).range(c.from, c.to)
      );
      addToCovered(c.from, c.to);
    }
  }

  // Links
  const links = findLinks(text, cursorFrom, cursorTo);
  for (const link of links) {
    if (!isInCoveredRange(link.from, link.to)) {
      decorations.push(
        Decoration.replace({
          widget: new LinkWidget(link.linkText, link.href),
        }).range(link.from, link.to)
      );
      addToCovered(link.from, link.to);
    }
  }

  // Bold+Italic (must be before bold and italic to match first)
  const boldItalics = findBoldItalic(text, cursorFrom, cursorTo);
  for (const bi of boldItalics) {
    if (!isInCoveredRange(bi.from, bi.to)) {
      decorations.push(
        Decoration.replace({
          widget: new BoldItalicWidget(bi.text),
        }).range(bi.from, bi.to)
      );
      addToCovered(bi.from, bi.to);
    }
  }

  // Bold
  const bolds = findBold(text, cursorFrom, cursorTo);
  for (const b of bolds) {
    if (!isInCoveredRange(b.from, b.to)) {
      decorations.push(
        Decoration.replace({
          widget: new BoldWidget(b.text),
        }).range(b.from, b.to)
      );
      addToCovered(b.from, b.to);
    }
  }

  // Italic
  const italics = findItalic(text, cursorFrom, cursorTo);
  for (const i of italics) {
    if (!isInCoveredRange(i.from, i.to)) {
      decorations.push(
        Decoration.replace({
          widget: new ItalicWidget(i.text),
        }).range(i.from, i.to)
      );
      addToCovered(i.from, i.to);
    }
  }

  // Sort and build
  decorations.sort((a, b) => a.from - b.from);
  for (const d of decorations) {
    builder.add(d.from, d.to, d.value);
  }

  return builder.finish();
}

// StateField for decorations
const livePreviewField = StateField.define<DecorationSet>({
  create(state) {
    return buildDecorations(state);
  },
  update(decorations, tr) {
    if (tr.docChanged || tr.selection) {
      return buildDecorations(tr.state);
    }
    return decorations;
  },
  provide: (f) => EditorView.decorations.from(f),
});

// Theme - tighter spacing to match published page
const editorTheme = EditorView.theme({
  "&": {
    fontSize: "16px",
    fontFamily: "var(--font-martina-plantijn), Georgia, serif",
    backgroundColor: "var(--background, #f9e9cb)",
  },
  ".cm-scroller": {
    overflow: "auto",
    backgroundColor: "var(--background, #f9e9cb)",
  },
  ".cm-content": {
    padding: "0 1.5rem",
    maxWidth: "800px",
    margin: "0 auto",
    caretColor: "#faad19",
  },
  ".cm-line": {
    padding: "0",
    lineHeight: "1.5",
  },
  // Empty lines (containing only a BR) should have reduced height
  ".cm-line:has(br:only-child)": {
    lineHeight: "1",
    minHeight: "1em",
  },
  // Override KaTeX display math margins
  ".katex-display": {
    margin: "0.5em 0 !important",
  },
  ".inline-math-widget": {
    display: "inline",
  },
  ".block-math-widget": {
    display: "block",
    textAlign: "center",
    margin: "0",
    padding: "0",
    overflowX: "auto",
  },
  ".image-widget": {
    display: "block",
    textAlign: "center",
    margin: "0.5rem 0",
    padding: "0",
  },
  ".image-widget img": {
    display: "inline-block",
    maxWidth: "100%",
  },
  ".details-widget": {
    display: "block",
    marginTop: "0.5rem",
    border: "1px solid #faad19",
    borderRadius: "8px",
    padding: "1rem",
    backgroundColor: "#fff8e1",
  },
  ".details-widget[open]": {
    backgroundColor: "#fff3cd",
  },
  ".details-widget summary": {
    listStyle: "none",
    position: "relative",
    paddingLeft: "1.25rem",
    cursor: "pointer",
  },
  ".details-widget summary::before": {
    content: '"▶"',
    position: "absolute",
    left: "0",
    transition: "transform 0.2s",
  },
  ".details-widget[open] summary::before": {
    transform: "rotate(90deg)",
  },
  ".link-widget": {
    color: "#0070f3",
    textDecoration: "none",
  },
  ".link-widget:hover": {
    textDecoration: "underline",
  },
  ".table-widget": {
    display: "block",
    margin: "0.5rem 0",
  },
  ".table-widget table": {
    borderCollapse: "separate",
    borderSpacing: "0",
    width: "100%",
    border: "1px solid #171717",
  },
  ".table-widget th": {
    backgroundColor: "#faad19",
    fontWeight: "bold",
    padding: "8px",
    textAlign: "left",
    border: "1px solid #171717",
  },
  ".table-widget td": {
    padding: "8px",
    textAlign: "left",
    border: "1px solid #171717",
  },
  // Heading styles - tighter margins
  ".heading-widget": {
    display: "block",
    width: "100%",
    fontFamily: "var(--font-arizona-flare), Georgia, serif",
    fontWeight: "normal",
    borderBottom: "2px solid #faad19",
    margin: "0",
    padding: "0",
  },
  ".heading-1": {
    fontSize: "2.25rem",
  },
  ".heading-2": {
    fontSize: "1.875rem",
  },
  ".heading-3": {
    fontSize: "1.5rem",
    borderBottom: "none",
  },
  ".heading-4": {
    fontSize: "1.25rem",
    borderBottom: "none",
    fontFamily: "var(--font-mallory-book), sans-serif",
  },
  ".heading-5": {
    fontSize: "1.125rem",
    borderBottom: "none",
    fontFamily: "var(--font-mallory-book), sans-serif",
  },
  ".heading-6": {
    fontSize: "1rem",
    borderBottom: "none",
    fontFamily: "var(--font-mallory-book), sans-serif",
  },
  // Bold style
  ".bold-widget": {
    fontWeight: "bold",
  },
  // Italic style
  ".italic-widget": {
    fontStyle: "italic",
  },
  // Inline code style - match published page
  ".inline-code-widget": {
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    fontSize: "0.875em",
    backgroundColor: "#f7fafc",
    color: "#2d3748",
    padding: "0.125rem 0.25rem",
    borderRadius: "0.25rem",
    border: "1px solid #e2e8f0",
  },
  "&.cm-focused .cm-cursor": {
    borderLeftColor: "#faad19",
    borderLeftWidth: "2px",
  },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground": {
    backgroundColor: "rgba(250, 173, 25, 0.3) !important",
  },
  ".cm-activeLine": {
    backgroundColor: "transparent",
  },
});

// Format date helper
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function LiveEditor({ content, onChange, metadata, postKey, onReady }: LiveEditorProps) {
  const editorRef = useRef<ReactCodeMirrorRef>(null);

  const handleChange = useCallback(
    (value: string) => {
      onChange(value);
    },
    [onChange]
  );

  // Call onReady with editor action methods
  // We need to call it after component mounts and whenever the view might change
  useEffect(() => {
    // Small timeout to ensure CodeMirror has initialized
    const timer = setTimeout(() => {
      if (onReady) {
        onReady({
          undo: () => {
            if (editorRef.current?.view) {
              return undo(editorRef.current.view);
            }
            return false;
          },
          redo: () => {
            if (editorRef.current?.view) {
              return redo(editorRef.current.view);
            }
            return false;
          },
          insertText: (text: string) => {
            const view = editorRef.current?.view;
            if (view) {
              const { from } = view.state.selection.main;
              view.dispatch({
                changes: { from, to: from, insert: text },
                selection: { anchor: from + text.length },
              });
              view.focus();
            }
          },
        });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [onReady, postKey]);

  return (
    <div className="live-editor bg-background h-full min-h-[calc(100vh-200px)]">
      {/* Frontmatter display - matches published page */}
      {metadata && (
        <div className="mx-auto max-w-[800px] px-6 pt-4">
          <h1 className="font-arizona-flare border-nav-background mt-4 mb-4 border-b-2 text-4xl font-normal">
            {metadata.title}
          </h1>
          {metadata.published && (
            <div className="font-mallory-book pb-4 text-gray-600">{formatDate(metadata.published)}</div>
          )}
          {metadata.tags && metadata.tags.length > 0 && (
            <div className="font-mallory-book pb-4 text-gray-500">Tags: {metadata.tags.join(", ")}</div>
          )}
        </div>
      )}

      <CodeMirror
        key={postKey}
        ref={editorRef}
        value={content}
        onChange={handleChange}
        extensions={[markdown({ codeLanguages: languages }), livePreviewField, editorTheme, EditorView.lineWrapping]}
        className="h-full"
        basicSetup={{
          lineNumbers: false,
          foldGutter: false,
          highlightActiveLine: false,
          highlightSelectionMatches: false,
        }}
      />
    </div>
  );
}

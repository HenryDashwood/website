/**
 * Post source rendered as self-contained HTML for the RSS feed.
 *
 * Posts are MDX, and feed readers get markup rather than React, so every
 * custom component in a post has to become something a reader can draw. The
 * source is parsed as MDX — the same syntax Next compiles — rather than run
 * through a plain Markdown parser, which sees no difference between an
 * `import` statement and a paragraph, and hands the sanitiser a `<LocalImage>`
 * it can only throw away.
 *
 * Maths is rendered to standalone MathML via KaTeX (`output: "mathml"`),
 * requiring no external CSS or fonts and rendering natively in WebKit,
 * Firefox, and Chromium-based feed readers.
 */

import type { Element, ElementContent, Properties, Root as HastRoot } from "hast";
import rehypeKatex from "rehype-katex";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkMdx from "remark-mdx";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import sanitizeHtml from "sanitize-html";
import { unified } from "unified";
import { visit } from "unist-util-visit";

export interface FeedHtmlOptions {
  /** Absolute base of the site, so a reader on another domain resolves `/media/...`. */
  siteUrl: string;
  /** Canonical URL of this post, linked to in place of anything that cannot be shown. */
  postUrl: string;
}

/** Components that render a single picture. */
const SINGLE_IMAGE_COMPONENTS = new Set(["LocalImage", "Image"]);

/** Components that take an `images={[...]}` array and lay it out. */
const IMAGE_LIST_COMPONENTS = new Set(["LocalImageGrid", "LocalImageSideBySide"]);

/**
 * Attributes kept when a post writes a plain HTML tag as JSX, such as
 * `<details>`. Everything else in a post is prose or presentation, and the
 * sanitiser would drop it a step later anyway.
 */
const PASSTHROUGH_ATTRIBUTES = new Set(["id", "class", "className", "href", "src", "alt", "title", "open", "lang"]);

/** MDX nodes that carry code rather than content, and belong nowhere in a feed. */
const DISCARDED_NODES = ["mdxjsEsm", "mdxFlowExpression", "mdxTextExpression"] as const;

const MATHML_TAGS = [
  "math",
  "mrow",
  "mi",
  "mn",
  "mo",
  "ms",
  "mtext",
  "mspace",
  "mfrac",
  "msqrt",
  "mroot",
  "mstyle",
  "merror",
  "mpadded",
  "mphantom",
  "mfenced",
  "menclose",
  "msub",
  "msup",
  "msubsup",
  "munder",
  "mover",
  "munderover",
  "mmultiscripts",
  "mprescripts",
  "none",
  "mtable",
  "mtr",
  "mtd",
  "mlabeledtr",
  "maction",
];

const MATHML_ATTRIBUTES = [
  "xmlns",
  "display",
  "mathvariant",
  "mathsize",
  "stretchy",
  "symmetric",
  "maxsize",
  "minsize",
  "lspace",
  "rspace",
  "fence",
  "separator",
  "accent",
  "accentunder",
  "linethickness",
  "width",
  "height",
  "depth",
  "columnalign",
  "rowalign",
  "columnspacing",
  "rowspacing",
  "columnlines",
  "rowlines",
  "frame",
  "framespacing",
  "notation",
  "scriptlevel",
  "displaystyle",
  "movablelimits",
  "largeop",
  "form",
  "rowspan",
  "columnspan",
  "voffset",
];

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [...sanitizeHtml.defaults.allowedTags, "img", "del", "details", "summary", ...MATHML_TAGS],
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    a: ["href", "name", "target", "id"],
    img: ["src", "alt", "title", "width", "height"],
    ...Object.fromEntries(MATHML_TAGS.map((tag) => [tag, MATHML_ATTRIBUTES])),
    // Footnote markers are only useful if they still point at their notes.
    "*": ["id"],
  },
};

/**
 * The subset of estree this file reads. JSX props are compiled expressions, so
 * `width={500}` and `images={[{ src: "..." }]}` arrive as syntax trees rather
 * than values, and are read back out statically — never evaluated.
 */
interface EstreeNode {
  type: string;
  value?: unknown;
  name?: string;
  elements?: (EstreeNode | null)[];
  properties?: EstreeNode[];
  key?: EstreeNode;
  operator?: string;
  argument?: EstreeNode;
  expressions?: EstreeNode[];
  quasis?: { value: { cooked?: string | null } }[];
  body?: EstreeNode[];
  expression?: EstreeNode;
}

interface JsxAttribute {
  type: string;
  name?: string;
  value?: string | { data?: { estree?: EstreeNode } } | null;
}

interface JsxElement {
  name: string | null;
  attributes: JsxAttribute[];
}

interface ImageSpec {
  src?: unknown;
  alt?: unknown;
  width?: unknown;
  height?: unknown;
  caption?: unknown;
}

/** A literal expression's value, or `undefined` if it depends on anything at runtime. */
function staticValue(node: EstreeNode | null | undefined): unknown {
  if (!node) return undefined;
  switch (node.type) {
    case "Literal":
      return node.value;
    case "ArrayExpression":
      return (node.elements ?? []).map(staticValue);
    case "ObjectExpression": {
      const object: Record<string, unknown> = {};
      for (const property of node.properties ?? []) {
        if (property.type !== "Property") continue;
        const key = property.key;
        const name = key?.type === "Identifier" ? key.name : key?.type === "Literal" ? String(key.value) : undefined;
        if (name === undefined) continue;
        object[name] = staticValue(property.value as EstreeNode | undefined);
      }
      return object;
    }
    case "UnaryExpression": {
      const value = staticValue(node.argument);
      if (node.operator === "-" && typeof value === "number") return -value;
      return undefined;
    }
    case "TemplateLiteral":
      if ((node.expressions ?? []).length > 0) return undefined;
      return (node.quasis ?? []).map((quasi) => quasi.value.cooked ?? "").join("");
    default:
      return undefined;
  }
}

/** A JSX element's props, as far as they can be known without running anything. */
function readAttributes(node: JsxElement): Record<string, unknown> {
  const attributes: Record<string, unknown> = {};
  for (const attribute of node.attributes ?? []) {
    // A spread — `{...props}` — has nothing statically readable in it.
    if (attribute.type !== "mdxJsxAttribute" || !attribute.name) continue;
    if (attribute.value === null || attribute.value === undefined) {
      attributes[attribute.name] = true;
    } else if (typeof attribute.value === "string") {
      attributes[attribute.name] = attribute.value;
    } else {
      const program = attribute.value.data?.estree;
      const statement = program?.body?.[0];
      attributes[attribute.name] = staticValue(
        statement?.type === "ExpressionStatement" ? statement.expression : undefined
      );
    }
  }
  return attributes;
}

function numeric(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) return Number(value);
  return undefined;
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function hasVisibleContent(nodes: ElementContent[]): boolean {
  return nodes.some((child) => (child.type === "text" ? child.value.trim() !== "" : true));
}

/** One picture, with its caption and/or JSX children if present. Sourceless images are dropped. */
function figureFor(spec: ImageSpec, extraCaption: ElementContent[] = []): Element | undefined {
  const src = text(spec.src);
  if (!src) return undefined;

  const properties: Properties = { src };
  const alt = text(spec.alt);
  if (alt) properties.alt = alt;
  const width = numeric(spec.width);
  if (width !== undefined) properties.width = width;
  const height = numeric(spec.height);
  if (height !== undefined) properties.height = height;

  const children: ElementContent[] = [{ type: "element", tagName: "img", properties, children: [] }];
  const caption = text(spec.caption);
  const captionChildren: ElementContent[] = [];
  if (caption) captionChildren.push({ type: "text", value: caption });
  if (hasVisibleContent(extraCaption)) {
    if (captionChildren.length > 0) captionChildren.push({ type: "text", value: " " });
    captionChildren.push(...extraCaption);
  }
  if (captionChildren.length > 0) {
    children.push({
      type: "element",
      tagName: "figcaption",
      properties: {},
      children: captionChildren,
    });
  }
  return { type: "element", tagName: "figure", properties: {}, children };
}

/** Stands in for a component that only exists as React, such as an interactive chart. */
function placeholderFor(attributes: Record<string, unknown>, postUrl: string): Element {
  const label = text(attributes.feedLabel);
  const feedImage = text(attributes.feedImage);

  if (feedImage) {
    const imgProperties: Properties = { src: feedImage };
    if (label) imgProperties.alt = label;
    const captionChildren: ElementContent[] = [
      {
        type: "element",
        tagName: "em",
        properties: {},
        children: [
          { type: "text", value: label ? `${label} — ` : "" },
          {
            type: "element",
            tagName: "a",
            properties: { href: postUrl },
            children: [{ type: "text", value: "try the interactive version on the original post" }],
          },
          { type: "text", value: "." },
        ],
      },
    ];
    return {
      type: "element",
      tagName: "figure",
      properties: {},
      children: [
        { type: "element", tagName: "img", properties: imgProperties, children: [] },
        { type: "element", tagName: "figcaption", properties: {}, children: captionChildren },
      ],
    };
  }

  return {
    type: "element",
    tagName: "p",
    properties: {},
    children: [
      {
        type: "element",
        tagName: "em",
        properties: {},
        children: label
          ? [
              { type: "text", value: `${label} — ` },
              {
                type: "element",
                tagName: "a",
                properties: { href: postUrl },
                children: [{ type: "text", value: "view it on the original post" }],
              },
              { type: "text", value: "." },
            ]
          : [
              { type: "text", value: "This post contains an interactive figure that a feed reader cannot show — " },
              {
                type: "element",
                tagName: "a",
                properties: { href: postUrl },
                children: [{ type: "text", value: "see it on the original post" }],
              },
              { type: "text", value: "." },
            ],
      },
    ],
  };
}

function passthroughProperties(attributes: Record<string, unknown>): Properties {
  const properties: Properties = {};
  for (const [name, value] of Object.entries(attributes)) {
    if (!PASSTHROUGH_ATTRIBUTES.has(name)) continue;
    if (value === true) {
      properties[name === "class" ? "className" : name] = true;
    } else if (typeof value === "string") {
      properties[name === "class" ? "className" : name] = value;
    }
  }
  return properties;
}

/**
 * Unwraps KaTeX's `<span class="katex">` wrapper and `<semantics>`/`<annotation>`
 * nodes so the feed contains clean standalone `<math>` elements. Dropping
 * `<annotation>` prevents tag-stripping readers from showing the formula twice.
 */
function rehypeCleanMathml() {
  return (tree: HastRoot) => {
    visit(tree, "element", (node: Element, index, parent) => {
      if (!parent || index === undefined) return;

      if (node.tagName === "span") {
        const className = node.properties?.className;
        const classes = Array.isArray(className) ? className.map(String) : [];
        if (classes.includes("katex") || classes.includes("katex-display")) {
          parent.children.splice(index, 1, ...node.children);
          return index;
        }
      }

      if (node.tagName === "semantics") {
        const withoutAnnotations = node.children.filter(
          (child) => !(child.type === "element" && child.tagName === "annotation")
        );
        parent.children.splice(index, 1, ...withoutAnnotations);
        return index;
      }
    });
  };
}

/** Relative URLs made absolute, so the feed reads the same on any domain. */
function rehypeAbsoluteUrls(siteUrl: string) {
  return (tree: HastRoot) => {
    if (!siteUrl) return;
    visit(tree, "element", (node: Element) => {
      for (const key of ["href", "src"] as const) {
        const value = node.properties?.[key];
        // Protocol-relative URLs are already absolute enough.
        if (typeof value === "string" && value.startsWith("/") && !value.startsWith("//")) {
          node.properties[key] = `${siteUrl}${value}`;
        }
      }
    });
  };
}

/**
 * MDX source as HTML a feed reader can render: no JSX, no imports, images
 * unpacked from their components, maths as standalone MathML, and every URL
 * absolute.
 */
export async function MdxToFeedHtml(source: string, options: FeedHtmlOptions): Promise<string> {
  const siteUrl = options.siteUrl.replace(/\/$/, "");
  const postUrl = options.postUrl;

  const jsxHandler = (state: { all: (node: never) => ElementContent[] }, node: JsxElement) => {
    // A fragment — `<>…</>` — is only its children.
    if (!node.name) return state.all(node as never);

    const attributes = readAttributes(node);

    if (SINGLE_IMAGE_COMPONENTS.has(node.name)) {
      return figureFor(attributes as ImageSpec, state.all(node as never));
    }

    if (IMAGE_LIST_COMPONENTS.has(node.name)) {
      const images = Array.isArray(attributes.images) ? attributes.images : [];
      const figures = images.map((image) => figureFor((image ?? {}) as ImageSpec)).filter(Boolean) as Element[];
      return figures.length > 0 ? figures : undefined;
    }

    // A lowercase name is a plain HTML tag written as JSX, such as <details>.
    if (node.name[0] === node.name[0].toLowerCase()) {
      return {
        type: "element",
        tagName: node.name,
        properties: passthroughProperties(attributes),
        children: state.all(node as never),
      } satisfies Element;
    }

    return placeholderFor(attributes, postUrl);
  };

  const handlers: Record<string, unknown> = {
    mdxJsxFlowElement: jsxHandler,
    mdxJsxTextElement: jsxHandler,
  };
  for (const type of DISCARDED_NODES) handlers[type] = () => undefined;

  const file = await unified()
    .use(remarkParse)
    .use(remarkMdx)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkRehype, { handlers: handlers as never })
    .use(rehypeKatex, { output: "mathml" })
    .use(rehypeCleanMathml)
    .use(rehypeAbsoluteUrls, siteUrl)
    .use(rehypeStringify)
    .process(source);

  return sanitizeHtml(String(file), SANITIZE_OPTIONS).trim();
}

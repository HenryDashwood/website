import assert from "node:assert/strict";
import { test } from "node:test";

import { MdxToFeedHtml } from "./feedHtml";

const OPTIONS = {
  siteUrl: "https://henrydashwood.com",
  postUrl: "https://henrydashwood.com/posts/example",
};

test("strips MDX imports and expressions", async () => {
  const mdx = `
import Foo from "./Foo";

export const helper = 123;

Hello world {1 + 2}.
`;
  const html = await MdxToFeedHtml(mdx, OPTIONS);
  assert.equal(html, "<p>Hello world .</p>");
});

test("unpacks LocalImage with caption and JSX children and absolutises URLs", async () => {
  const mdx = `
<LocalImage
  src="/media/posts/example/chart.png"
  alt="A chart"
  width={600}
  height={400}
  caption="Main caption."
>
  Source: [Example](/posts/other).
</LocalImage>
`;
  const html = await MdxToFeedHtml(mdx, OPTIONS);
  assert.match(html, /<figure><img src="https:\/\/henrydashwood\.com\/media\/posts\/example\/chart\.png"/);
  assert.match(html, /alt="A chart"/);
  assert.match(html, /width="600"/);
  assert.match(html, /height="400"/);
  assert.match(
    html,
    /<figcaption>Main caption\. <p>Source: <a href="https:\/\/henrydashwood\.com\/posts\/other">Example<\/a>\.<\/p><\/figcaption>/
  );
});

test("unpacks LocalImageSideBySide and LocalImageGrid", async () => {
  const mdx = `
<LocalImageSideBySide
  images={[
    { src: "/media/posts/example/a.png", alt: "First", caption: "One" },
    { src: "/media/posts/example/b.png", alt: "Second" },
  ]}
/>
`;
  const html = await MdxToFeedHtml(mdx, OPTIONS);
  assert.match(html, /src="https:\/\/henrydashwood\.com\/media\/posts\/example\/a\.png"/);
  assert.match(html, /<figcaption>One<\/figcaption>/);
  assert.match(html, /src="https:\/\/henrydashwood\.com\/media\/posts\/example\/b\.png"/);
});

test("renders interactive component fallbacks with default, feedLabel, and feedImage", async () => {
  const mdx = `
<UnknownChart />

<CustomDiagram feedLabel="Interactive labour market diagram" />

<SnapshotViz feedLabel="Wage curve" feedImage="/media/posts/example/wage.png" />
`;
  const html = await MdxToFeedHtml(mdx, OPTIONS);
  assert.match(
    html,
    /This post contains an interactive figure that a feed reader cannot show — <a href="https:\/\/henrydashwood\.com\/posts\/example">see it on the original post<\/a>\./
  );
  assert.match(
    html,
    /Interactive labour market diagram — <a href="https:\/\/henrydashwood\.com\/posts\/example">view it on the original post<\/a>\./
  );
  assert.match(
    html,
    /<figure><img src="https:\/\/henrydashwood\.com\/media\/posts\/example\/wage\.png" alt="Wage curve" \/><figcaption><em>Wage curve — <a href="https:\/\/henrydashwood\.com\/posts\/example">try the interactive version on the original post<\/a>\.<\/em><\/figcaption><\/figure>/
  );
});

test("renders inline and display maths as standalone MathML without annotation duplicates", async () => {
  const mdx = `
Inline $x^2 + 1$ and block:

$$
\\frac{a}{b}
$$
`;
  const html = await MdxToFeedHtml(mdx, OPTIONS);
  assert.match(html, /<math xmlns="http:\/\/www\.w3\.org\/1998\/Math\/MathML">/);
  assert.match(html, /<math xmlns="http:\/\/www\.w3\.org\/1998\/Math\/MathML" display="block">/);
  assert.match(html, /<mfrac>/);
  assert.doesNotMatch(html, /<annotation/);
  assert.doesNotMatch(html, /<semantics/);
  assert.doesNotMatch(html, /class="katex"/);
});

test("preserves GFM strikethrough, footnotes, and details elements", async () => {
  const mdx = `
Some ~~struck~~ text with a footnote[^1].

<details>
<summary>More</summary>
Hidden text.
</details>

[^1]: Footnote body.
`;
  const html = await MdxToFeedHtml(mdx, OPTIONS);
  assert.match(html, /<del>struck<\/del>/);
  assert.match(html, /<details>/);
  assert.match(html, /<summary>More<\/summary>/);
  assert.match(html, /id="user-content-fn-1"/);
});

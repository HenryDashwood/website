import { ImageResponse } from "next/og";

/** Podcast and feed artwork is square, and directories want it large: Apple's
 *  floor is 1400px. Social cards keep the landscape shape they have always had. */
const SHAPES = {
  card: { width: 1200, height: 630 },
  square: { width: 1400, height: 1400 },
} as const;

/** The site's crest, or nothing if it cannot be read.
 *
 *  The bundler rewrites the `new URL(…, import.meta.url)` to the root-relative
 *  path it serves the asset from, which `fetch` will not take on its own — so
 *  it is resolved against the incoming request to get back to an absolute URL.
 *  A failure here costs the artwork its crest, not the whole image.
 */
async function loadCrest(requestUrl: string): Promise<ArrayBuffer | null> {
  try {
    const asset = String(new URL("../../icon-192.png", import.meta.url));
    const response = await fetch(new URL(asset, requestUrl));
    return response.ok ? await response.arrayBuffer() : null;
  } catch (error) {
    console.error("og crest could not be loaded", error);
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const hasTitle = searchParams.has("title");
    const title = hasTitle ? searchParams.get("title")?.slice(0, 100) : "henrydashwood.com";
    const shape = searchParams.get("shape") === "square" ? SHAPES.square : SHAPES.card;
    const isSquare = shape === SHAPES.square;

    const crest = isSquare ? await loadCrest(request.url) : null;

    return new ImageResponse(
      <div
        style={{
          backgroundColor: "#faad19", // navBackground color
          backgroundSize: "150px 150px",
          height: "100%",
          width: "100%",
          display: "flex",
          textAlign: "center",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          flexWrap: "nowrap",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            justifyItems: "center",
          }}
        >
          {crest ? (
            // Held near its native size: the source is 192px, and stretching an
            // engraving across the whole canvas would only magnify its edges.
            /* eslint-disable-next-line @next/next/no-img-element */
            <img alt="" width={384} height={384} src={crest as unknown as string} />
          ) : null}
        </div>
        <div
          style={{
            fontSize: isSquare ? 96 : 60,
            fontStyle: "normal",
            letterSpacing: "-0.025em",
            color: "#000000", // foreground color
            marginTop: 30,
            padding: isSquare ? "0 140px" : "0 120px",
            lineHeight: 1.4,
            whiteSpace: "pre-wrap",
          }}
        >
          {title}
        </div>
      </div>,
      shape
    );
  } catch (error) {
    // Logged, because the response deliberately says nothing: a broken card is
    // otherwise a 500 with no trace of what went wrong.
    console.error("og image generation failed", error);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}

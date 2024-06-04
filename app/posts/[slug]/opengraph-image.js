import { ImageResponse } from "next/og";
import { fetcher } from "../../../lib/api";

export const runtime = "edge";

export const alt = "Henry Dashwood";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image({ params }) {
  const postData = await fetcher(
    `${process.env.NEXT_PUBLIC_STRAPI_URL}/posts?filters[slug][$eq]=${params.slug}&populate[0]=tags`
  );
  const title = postData.data[0].attributes.title;
  const description = postData.data[0].attributes.content.substring(0, 200);

  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 100,
          background: "#faad19",
          width: "100%",
          height: "100%",
          display: "flex",
          padding: 25,
        }}
      >
        {title}
      </div>
    ),
    {
      ...size,
    }
  );
}

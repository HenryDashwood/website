import NavBar from "../../../components/Nav";
import PostContent from "../../../components/PostContent";
import TwitterScript from "../../../components/TwitterScript";
import Wrapper from "../../../components/Wrapper";
import { fetcher } from "../../../lib/api";
import markdownToHTML from "../../../lib/markdownToHTML";

export const revalidate = 3600;

export async function generateStaticParams() {
  const thingsData = await fetcher(
    `${process.env.NEXT_PUBLIC_STRAPI_URL}/posts`
  );
  const output = thingsData.data.map((thing) => ({
    slug: thing.attributes.slug.toString(),
  }));
  return output;
}

async function getContent(params) {
  const thingData = await fetcher(
    `${process.env.NEXT_PUBLIC_STRAPI_URL}/posts?filters[slug][$eq]=${params.slug}&populate[0]=tags`
  );
  if (thingData.data) {
    const { content, hasTwitterEmbed } = await markdownToHTML(
      thingData.data[0].attributes.content
    );
    let tagsArray = [];
    if (thingData.data[0].attributes.tags.data) {
      tagsArray = thingData.data[0].attributes.tags.data.map((tag) => {
        return tag.attributes.name;
      });
    }
    return {
      title: thingData.data[0].attributes.title,
      published: thingData.data[0].attributes.published,
      content: content,
      tags: tagsArray,
      hasTwitterEmbed: hasTwitterEmbed,
    };
  } else {
    return {
      error: thingData.error.message,
    };
  }
}

async function Post({ params }) {
  const { title, published, content, tags, hasTwitterEmbed } = await getContent(
    params
  );
  return (
    <Wrapper>
      <NavBar />
      <PostContent
        title={title}
        published={published}
        content={content}
        tags={tags}
      />
      <TwitterScript hasTwitterEmbed={hasTwitterEmbed} />
    </Wrapper>
  );
}

export async function generateMetadata({ params }) {
  const { title, published, content, tags } = await getContent(params);
  return {
    title: title,
    openGraph: {
      title: title,
      description: content.replace(/<[^>]*>/g, "").substring(0, 200),
      images: [
        {
          url: `${process.env.WEBSITE_URL}/posts/${params.slug}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: "Post Image",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: title,
      description: content.replace(/<[^>]*>/g, "").substring(0, 200),
      images: [
        {
          url: `${process.env.WEBSITE_URL}/posts/${params.slug}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: "Post Image",
        },
      ],
    },
  };
}

export default Post;

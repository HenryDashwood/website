import Content from "../../../components/Content";
import Date from "../../../components/Date";
import NavBar from "../../../components/Nav";
import Wrapper from "../../../components/Wrapper";
import { fetcher } from "../../../lib/api";
import markdownToHTML from "../../../lib/markdownToHTML";
import utilStyles from "../../../styles/utils.module.css";

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
    const content = await markdownToHTML(thingData.data[0].attributes.content);
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
    };
  } else {
    return {
      error: thingData.error.message,
    };
  }
}

async function Post({ params }) {
  const { title, published, content, tags } = await getContent(params);
  return (
    <Wrapper>
      <NavBar />
      <Content>
        <h1 className={utilStyles.headingXl}>{title}</h1>
        <div className={utilStyles.lightText}>
          <Date dateString={published} />
        </div>
        <div dangerouslySetInnerHTML={{ __html: content }} />
        <div className={utilStyles.lightText}>Tags: {tags}</div>
      </Content>
    </Wrapper>
  );
}

export async function generateMetadata({ params }) {
  const { title, published, content, tags } = await getContent(params);
  return {
    title: title,
    description: content.replace(/<[^>]*>/g, "").substring(0, 200),
  };
}

export default Post;

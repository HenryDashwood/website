import Head from "next/head";
import Content from "../../../../components/content/content";
import Date from "../../../../components/date/date";
import utilStyles from "../../../../styles/utils.module.css";
import NavBar from "../../../../components/nav/nav";
import Wrapper from "../../../../components/wrapper/wrapper";
import { fetcher } from "../../../../lib/api";
import markdownToHTML from "../../../../lib/markdownToHTML";

export async function generateStaticParams() {
  const thingsData = await fetcher(
    `${process.env.NEXT_PUBLIC_LOCAL_STRAPI_URL}/posts`
  );
  const output = thingsData.data.map((thing) => ({
    slug: thing.attributes.slug.toString(),
  }));
  return output;
}

async function getContent(params) {
  const thingData = await fetcher(
    `${process.env.NEXT_PUBLIC_LOCAL_STRAPI_URL}/posts?filters[slug][$eq]=${params.slug}&populate[0]=tags`
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
  console.log(tags);
  return (
    <Wrapper>
      <NavBar />
      <Content>
        <Head>
          <title>{title}</title>
        </Head>
        <article>
          <h1 className={utilStyles.headingXl}>{title}</h1>
          <div className={utilStyles.lightText}>
            <Date dateString={published} />
          </div>
          <div dangerouslySetInnerHTML={{ __html: content }} />

          <div className={utilStyles.lightText}>Tags: {tags}</div>
        </article>
      </Content>
    </Wrapper>
  );
}

export default Post;

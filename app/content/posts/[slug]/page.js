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
    `${process.env.NEXT_PUBLIC_PUBLIC_STRAPI_URL}/posts`
  );
  const output = thingsData.data.map((thing) => ({
    slug: thing.attributes.slug.toString(),
  }));
  return output;
}

async function getContent(params) {
  const thingData = await fetcher(
    `${process.env.NEXT_PUBLIC_PUBLIC_STRAPI_URL}/slugify/slugs/post/${params.slug}`
  );
  if (thingData.data) {
    const content = await markdownToHTML(thingData.data.attributes.content);
    return {
      title: thingData.data.attributes.title,
      published: thingData.data.attributes.published,
      content: content,
    };
  } else {
    return {
      error: thingData.error.message,
    };
  }
}

async function Post({ params }) {
  const { title, published, content } = await getContent(params);
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
        </article>
      </Content>
    </Wrapper>
  );
}

export default Post;

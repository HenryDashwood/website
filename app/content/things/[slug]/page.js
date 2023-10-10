import Head from "next/head";
import Content from "../../../../components/content/content";
import utilStyles from "../../../../styles/utils.module.css";
import NavBar from "../../../../components/nav/nav";
import Wrapper from "../../../../components/wrapper/wrapper";
import { fetcher } from "../../../../lib/api";
import markdownToHTML from "../../../../lib/markdownToHTML";

export async function generateStaticParams() {
  const thingsData = await fetcher(
    `${process.env.NEXT_PUBLIC_LOCAL_STRAPI_URL}/things`
  );
  const output = thingsData.data.map((thing) => ({
    slug: thing.attributes.slug.toString(),
  }));
  return output;
}

async function getContent(params) {
  const thingData = await fetcher(
    `${process.env.NEXT_PUBLIC_LOCAL_STRAPI_URL}/things?filters[slug][$eq]=${params.slug}`
  );
  if (thingData.data) {
    const content = await markdownToHTML(thingData.data[0].attributes.content);
    return {
      title: thingData.data[0].attributes.title,
      content: content,
    };
  } else {
    return {
      title: "Error",
      content: thingData.error.message,
    };
  }
}

async function Thing({ params }) {
  const { title, content } = await getContent(params);
  return (
    <Wrapper>
      <NavBar />
      <Content>
        <Head>
          <title>{title}</title>
        </Head>
        <article>
          <h1 className={utilStyles.headingXl}>{title}</h1>
          <div dangerouslySetInnerHTML={{ __html: content }} />
        </article>
      </Content>
    </Wrapper>
  );
}

export default Thing;

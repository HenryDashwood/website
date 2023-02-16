import Head from "next/head";
import Content from "../../../components/content/content";
import utilStyles from "../../../styles/utils.module.css";
import NavBar from "../../../components/nav/nav";
import Wrapper from "../../../components/wrapper/wrapper";
import { fetcher } from "../../../lib/api";
import markdownToHTML from "../../../lib/markdownToHTML";

const Thing = ({ thing, content }) => {
  return (
    <Wrapper>
      <NavBar />
      <Content>
        <Head>
          <title>{thing.attributes.title}</title>
        </Head>
        <article>
          <h1 className={utilStyles.headingXl}>{thing.attributes.title}</h1>
          <div dangerouslySetInnerHTML={{ __html: content }} />
        </article>
      </Content>
    </Wrapper>
  );
};

export async function getStaticPaths() {
  const thingsData = await fetcher(`${process.env.PUBLIC_STRAPI_URL}/things`);
  return {
    paths: thingsData.data.map((thing) => ({
      params: { slug: thing.attributes.slug.toString() },
    })),
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  const { slug } = params;
  const thingData = await fetcher(
    `${process.env.PUBLIC_STRAPI_URL}/slugify/slugs/thing/${slug}?populate=*`
  );
  if (thingData.data) {
    const content = await markdownToHTML(thingData.data.attributes.content);
    return {
      props: {
        thing: thingData.data,
        content,
      },
    };
  } else {
    return {
      props: {
        error: thingData.error.message,
      },
    };
  }
}

export default Thing;

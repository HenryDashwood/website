import Head from "next/head";
import Content from "../../../components/content/content";
import { getAllThingIds, getThingData } from "../../../lib/things";
import utilStyles from "../../../styles/utils.module.css";
import NavBar from "../../../components/nav/nav";
import Wrapper from "../../../components/wrapper/wrapper";

export async function getStaticProps({ params }) {
  const thingData = await getThingData(params.id);
  return {
    props: {
      thingData,
    },
  };
}

export async function getStaticPaths() {
  const paths = getAllThingIds();
  return {
    paths,
    fallback: false,
  };
}

export default function Thing({ thingData }) {
  return (
    <Wrapper>
      <NavBar />
      <Content>
        <Head>
          <title>{thingData.title}</title>
        </Head>
        <article>
          <h1 className={utilStyles.headingXl}>{thingData.title}</h1>
          <div dangerouslySetInnerHTML={{ __html: thingData.contentHtml }} />
        </article>
      </Content>
    </Wrapper>
  );
}

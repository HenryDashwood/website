import Head from "next/head";
import Content from "../../../components/content";
import { getAllPostIds, getPostData } from "../../../lib/posts";
import Date from "../../../components/date";
import utilStyles from "../../../styles/utils.module.css";
import NavBar from "../../../components/nav";
import Wrapper from "../../../components/wrapper";

export async function getStaticProps({ params }) {
  const postData = await getPostData(params.id);
  return {
    props: {
      postData,
    },
  };
}

export async function getStaticPaths() {
  const paths = getAllPostIds();
  return {
    paths,
    fallback: false,
  };
}

export default function Post({ postData }) {
  return (
    <Wrapper>
      <NavBar />
      <Content>
        <Head>
          <title>{postData.title}</title>
        </Head>
        <article>
          <h1 className={utilStyles.headingXl}>{postData.title}</h1>
          <div className={utilStyles.lightText}>
            <Date dateString={postData.date} />
          </div>
          <div dangerouslySetInnerHTML={{ __html: postData.contentHtml }} />
        </article>
      </Content>
    </Wrapper>
  );
}
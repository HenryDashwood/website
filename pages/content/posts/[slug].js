import Head from "next/head";
import Content from "../../../components/content/content";
import Date from "../../../components/date/date";
import utilStyles from "../../../styles/utils.module.css";
import NavBar from "../../../components/nav/nav";
import Wrapper from "../../../components/wrapper/wrapper";
import { fetcher } from "../../../lib/api";
import markdownToHTML from "../../../lib/markdownToHTML";

const Post = ({ post, content }) => {
  return (
    <Wrapper>
      <NavBar />
      <Content>
        <Head>
          <title>{post.attributes.title}</title>
        </Head>
        <article>
          <h1 className={utilStyles.headingXl}>{post.attributes.title}</h1>
          <div className={utilStyles.lightText}>
            <Date dateString={post.attributes.published} />
          </div>
          <div dangerouslySetInnerHTML={{ __html: content }} />
        </article>
      </Content>
    </Wrapper>
  );
};

export async function getStaticPaths() {
  const postsData = await fetcher(`${process.env.PUBLIC_STRAPI_URL}/posts`);
  return {
    paths: postsData.data.map((post) => ({
      params: { slug: post.attributes.slug.toString() },
    })),
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  const { slug } = params;
  const postData = await fetcher(
    `${process.env.PUBLIC_STRAPI_URL}/slugify/slugs/post/${slug}`
  );
  if (postData.data) {
    const content = await markdownToHTML(postData.data.attributes.content);
    return {
      props: {
        post: postData.data,
        content,
      },
    };
  } else {
    return {
      props: {
        error: postData.error.message,
      },
    };
  }
}

export default Post;

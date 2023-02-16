import Head from "next/head";
import Link from "next/link";
import Content from "../components/content/content";
import utilStyles from "../styles/utils.module.css";
import Date from "../components/date/date";
import NavBar from "../components/nav/nav";
import Wrapper from "../components/wrapper/wrapper";
import useSWR from "swr";
import { useState } from "react";
import { fetcher } from "../lib/api";

export const pageTitle = "Blog Posts";

export async function getStaticProps() {
  const postsData = await fetcher(
    `${process.env.PUBLIC_STRAPI_URL}/posts?pagination[page]=1&pagination[pageSize]=5`
  );
  return {
    props: {
      posts: postsData,
    },
  };
}

export default function PostList({ posts }) {
  const [pageIndex, setPageIndex] = useState(1);
  const { data, error } = useSWR(
    `${process.env.PUBLIC_STRAPI_URL}/posts?pagination[page]=${pageIndex}&pagination[pageSize]=5`,
    fetcher,
    { fallbackData: posts }
  );
  return (
    <Wrapper>
      <NavBar />
      <Content home>
        <Head>
          <title>{pageTitle}</title>
        </Head>
        <section className={`${utilStyles.headingMd} ${utilStyles.padding1px}`}>
          <h2 className={utilStyles.headingLg}>Blog</h2>
          <ul className={utilStyles.list}>
            {data &&
              data.data.map((post) => {
                return (
                  <li className={utilStyles.listItem} key={post.id}>
                    <Link href={`/content/posts/` + post.attributes.slug}>
                      {post.attributes.title}
                    </Link>
                    <br />
                    <small className={utilStyles.lightText}>
                      <Date dateString={post.attributes.published} />
                    </small>
                  </li>
                );
              })}
          </ul>
        </section>
      </Content>
    </Wrapper>
  );
}

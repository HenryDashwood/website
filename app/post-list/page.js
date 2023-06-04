"use client";

import Head from "next/head";
import Link from "next/link";
import Content from "../../components/content/content";
import utilStyles from "../../styles/utils.module.css";
import Date from "../../components/date/date";
import NavBar from "../../components/nav/nav";
import Wrapper from "../../components/wrapper/wrapper";
import { fetcher } from "../../lib/api";
import useSWR from "swr";

export const pageTitle = "Blog Posts";

function PostList() {
  const { data } = useSWR(
    `${process.env.NEXT_PUBLIC_PUBLIC_STRAPI_URL}/posts?sort[0]=published:desc&pagination[page]=1&pagination[pageSize]=5`,
    fetcher
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

export default PostList;

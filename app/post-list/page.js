"use client";

import Link from "next/link";
import Content from "../../components/Content";
import utilStyles from "../../styles/utils.module.css";
import Date from "../../components/Date";
import NavBar from "../../components/Nav";
import Wrapper from "../../components/Wrapper";
import { fetcher } from "../../lib/api";
import useSWR from "swr";

function PostList() {
  const { data } = useSWR(
    `${process.env.NEXT_PUBLIC_STRAPI_URL}/posts?sort[0]=published:desc`,
    fetcher
  );
  return (
    <Wrapper>
      <NavBar />
      <Content home>
        <section className={`${utilStyles.headingMd} ${utilStyles.padding1px}`}>
          <h2 className={utilStyles.headingLg}>Blog</h2>
          <ul className={utilStyles.list}>
            {data &&
              data.data.map((post) => {
                return (
                  <li className={utilStyles.listItem} key={post.id}>
                    <Link href={`/posts/` + post.attributes.slug}>
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

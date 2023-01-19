import Head from "next/head";
import Link from "next/link";
import Content from "../components/content/content";
import utilStyles from "../styles/utils.module.css";
import { getSortedPostsData } from "../lib/posts";
import Date from "../components/date/date";
import NavBar from "../components/nav/nav";
import Wrapper from "../components/wrapper/wrapper";

export const pageTitle = "Blog Posts";

export async function getStaticProps() {
  const allPostsData = getSortedPostsData();
  return {
    props: {
      allPostsData,
    },
  };
}

export default function PostList({ allPostsData }) {
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
            {allPostsData.map(({ id, date, title }) => (
              <li className={utilStyles.listItem} key={id}>
                <Link href={`/content/posts/${id}`}>{title}</Link>
                <br />
                <small className={utilStyles.lightText}>
                  <Date dateString={date} />
                </small>
              </li>
            ))}
          </ul>
        </section>
      </Content>
    </Wrapper>
  );
}

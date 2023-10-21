import Link from "next/link";
import Content from "../../components/Content";
import utilStyles from "../../styles/utils.module.css";
import Date from "../../components/Date";
import NavBar from "../../components/Nav";
import Wrapper from "../../components/Wrapper";
import { fetcher } from "../../lib/api";

export const revalidate = 3600;

async function PostList() {
  const { data } = await fetcher(
    `${process.env.NEXT_PUBLIC_STRAPI_URL}/posts?sort[0]=published:desc`
  );
  return (
    <Wrapper>
      <NavBar />
      <Content home>
        <h1>Blog Posts</h1>
        <ul className={utilStyles.list}>
          {data &&
            data.map((post) => {
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
      </Content>
    </Wrapper>
  );
}

export default PostList;

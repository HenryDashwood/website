import Link from "next/link";
import Content from "@/components/Content";
import Date from "@/components/Date";
import NavContentWrapper from "@/components/NavContentWrapper";

export const revalidate = 3600;

interface Post {
  id: number;
  attributes: {
    slug: string;
    title: string;
    published: string;
  };
}

async function PostList() {
  const data = await fetch(
    `${process.env.NEXT_PUBLIC_STRAPI_URL}/posts?sort[0]=published:desc`
  ).then((res) => res.json());

  return (
    <NavContentWrapper>
      <Content>
        <h1>Blog Posts</h1>
        <ul>
          {data &&
            data.data.map((post: Post) => {
              return (
                <li key={post.id}>
                  <Link href={`/posts/` + post.attributes.slug}>
                    {post.attributes.title}
                  </Link>
                  <br />
                  <small>
                    <Date dateString={post.attributes.published} />
                  </small>
                </li>
              );
            })}
        </ul>
      </Content>
    </NavContentWrapper>
  );
}

export default PostList;

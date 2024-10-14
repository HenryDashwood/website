import Link from "next/link";
import DateComponent from "@/components/Date";
import Content from "@/components/Content";
import NavContentWrapper from "@/components/NavContentWrapper";
import { GetPosts } from "@/lib/posts";

export const revalidate = 3600;

async function PostList() {
  const posts = await GetPosts(false);

  return (
    <NavContentWrapper>
      <Content>
        <h1>Blog Posts</h1>
        <ul className="list-none p-0">
          {posts.map((post) => {
            return (
              <li key={post.metadata.id} className="mb-4">
                <Link href={`/posts/` + post.metadata.slug}>
                  {post.metadata.title}
                </Link>
                <br />
                <small>
                  <DateComponent
                    dateString={post.metadata.published.toISOString()}
                  />
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

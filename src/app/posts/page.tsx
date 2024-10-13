import path from "path";
import { readdirSync, readFileSync } from "fs";
import matter from "gray-matter";
import Link from "next/link";
import DateComponent from "@/components/Date";
import Content from "@/components/Content";
import NavContentWrapper from "@/components/NavContentWrapper";

export const revalidate = 3600;

interface Post {
  id: number;
  title: string;
  slug: string;
  published: Date;
  tags: string[];
}

async function GetPostPreviews() {
  const postDirectories = readdirSync(path.join(process.cwd(), "posts"));

  const postPreviews: Post[] = [];
  for (const postDirectory of postDirectories) {
    const postFile = readFileSync(`posts/${postDirectory}/post.mdx`, "utf8");
    const { data } = matter(postFile);

    postPreviews.push({
      ...data,
      published: new Date(data.published),
      slug: postDirectory,
    } as Post);
  }

  return postPreviews;
}

async function PostList() {
  const postPreviews = await GetPostPreviews();

  return (
    <NavContentWrapper>
      <Content>
        <h1>Blog Posts</h1>
        <ul className="list-none p-0">
          {postPreviews.map((post) => {
            return (
              <li key={post.id} className="mb-4">
                <Link href={`/posts/` + post.slug}>{post.title}</Link>
                <br />
                <small>
                  <DateComponent dateString={post.published.toISOString()} />
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

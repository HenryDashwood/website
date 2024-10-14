import path from "path";
import { readdirSync, readFileSync } from "fs";
import matter from "gray-matter";

interface PostMetadata {
  id: number;
  title: string;
  slug: string;
  published: Date;
  tags: string[];
}

interface Post {
  metadata: PostMetadata;
  content: string | null;
}

export async function GetPosts(withContent: boolean) {
  const postDirectories = readdirSync(path.join(process.cwd(), "posts"));

  const posts: Post[] = [];
  for (const postDirectory of postDirectories) {
    const post = await GetPost(postDirectory, withContent);
    posts.push({
      metadata: {
        ...post.metadata,
        slug: postDirectory,
        published: new Date(post.metadata.published),
      },
      content: post.content,
    } as Post);
  }

  posts.sort(
    (a, b) => b.metadata.published.getTime() - a.metadata.published.getTime()
  );
  return posts;
}

export async function GetPost(slug: string, withContent: boolean) {
  const postFile = readFileSync(`posts/${slug}/post.mdx`, "utf8");

  const post: Post = {
    metadata: {
      id: -1,
      title: "",
      slug: "",
      published: new Date(),
      tags: [],
    },
    content: null,
  };

  if (withContent === false) {
    const { data } = matter(postFile);
    post.metadata = data as PostMetadata;
  } else {
    const { data, content } = matter(postFile);
    post.metadata = data as PostMetadata;
    post.content = content;
  }

  return post;
}

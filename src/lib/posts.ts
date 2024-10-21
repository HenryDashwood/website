import path from "path";
import { readdirSync, readFileSync, statSync } from "fs";
import { Metadata } from "next";

interface Post {
  metadata: Metadata;
  content: string | null;
}

export async function GetPosts(withContent: boolean) {
  const postsPath = path.join(process.cwd(), "src/app/posts");
  const postDirectories = readdirSync(postsPath).filter(
    (item) =>
      statSync(path.join(postsPath, item)).isDirectory() &&
      !item.startsWith("[")
  );

  const posts: Post[] = [];
  for (const postDirectory of postDirectories) {
    const post = await GetPost(postDirectory, withContent);

    if (!post.metadata.other || !post.metadata.other.published) {
      throw new Error("Metadata is undefined");
    }

    posts.push({
      metadata: {
        ...post.metadata,
        published: post.metadata.other.published,
      },
      content: post.content,
    } as Post);
  }

  posts.sort((a, b) => {
    if (!a.metadata.other || !b.metadata.other) {
      throw new Error("Metadata is undefined");
    }

    return (
      new Date(String(b.metadata.other.published)).getTime() -
      new Date(String(a.metadata.other.published)).getTime()
    );
  });
  return posts;
}

export async function GetPost(slug: string, withContent: boolean) {
  const { metadata } = await import(`../app/posts/${slug}/page`);

  const post: Post = {
    metadata: {
      ...metadata,
      published: metadata.other.published,
    },
    content: null,
  };

  if (withContent === true) {
    const postFile = readFileSync(
      path.join(process.cwd(), `src/app/posts/${slug}/post.mdx`)
    );
    post.content = postFile.toString("utf-8");
  }

  return post;
}

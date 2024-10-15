import path from "path";
import { readdirSync, readFileSync, statSync } from "fs";

export interface PostMetadata {
  id: number;
  title: string;
  slug: string;
  published: string;
  tags: string[];
}

interface Post {
  postMetadata: PostMetadata;
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
    posts.push({
      postMetadata: {
        ...post.postMetadata,
        published: post.postMetadata.published,
      },
      content: post.content,
    } as Post);
  }

  posts.sort(
    (a, b) =>
      new Date(b.postMetadata.published).getTime() -
      new Date(a.postMetadata.published).getTime()
  );
  return posts;
}

export async function GetPost(slug: string, withContent: boolean) {
  const { postMetadata } = await import(`../app/posts/${slug}/page`);

  const post: Post = {
    postMetadata: {
      ...postMetadata,
      published: postMetadata.published,
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

import { readdirSync, readFileSync } from "fs";
import path from "path";
import matter from "gray-matter";

interface Post {
  id: number;
  title: string;
  slug: string;
  published: Date;
  tags: string[];
}

async function GetPostTags() {
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

async function LinkBox({ tag }: { tag: string }) {
  const postsData = await GetPostTags();
  const filteredPosts = postsData.filter((post) => post.tags.includes(tag));

  return (
    <div className="border-2 border-[#faad19] rounded-lg p-4 m-[2.5%]">
      <h2>{tag}</h2>
      <ul className="pl-4">
        {filteredPosts.length > 0 ? (
          filteredPosts.map((post: Post) => (
            <li key={post.id} className="ml-2 mb-2">
              <a href={`/posts/${post.slug}`}>{post.title}</a>
            </li>
          ))
        ) : (
          <p>No posts available for this tag.</p>
        )}
      </ul>
    </div>
  );
}

export default LinkBox;

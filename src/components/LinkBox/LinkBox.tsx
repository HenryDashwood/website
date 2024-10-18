import { readdirSync, statSync } from "fs";
import path from "path";
import { GetPost } from "@/lib/posts";
import { PostMetadata } from "@/lib/posts";

async function GetPostTags() {
  const postsPath = path.join(process.cwd(), "src/app/posts");
  const postDirectories = readdirSync(postsPath).filter(
    (item) =>
      statSync(path.join(postsPath, item)).isDirectory() &&
      !item.startsWith("[")
  );

  const postPreviews: PostMetadata[] = [];
  for (const postDirectory of postDirectories) {
    const post = await GetPost(postDirectory, false);

    postPreviews.push({
      ...post.postMetadata,
      published: post.postMetadata.published,
    } as PostMetadata);
  }

  return postPreviews;
}

async function LinkBox({ tag }: { tag: string }) {
  const postsData = await GetPostTags();

  console.log(postsData);

  const filteredPosts = postsData.filter(
    (post) => post.tags && post.tags.includes(tag)
  );

  return (
    <div className="border-2 border-[#faad19] rounded-lg p-4 m-[2.5%]">
      <h2>{tag}</h2>
      <ul className="pl-4">
        {filteredPosts.length > 0 ? (
          filteredPosts.map((post: PostMetadata) => (
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

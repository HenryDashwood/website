import { GetPost } from "@/lib/posts";
import { readdirSync, statSync } from "fs";
import { Metadata } from "next";
import path from "path";
async function GetPostTags() {
  const postsPath = path.join(process.cwd(), "src/app/posts");
  const postDirectories = readdirSync(postsPath).filter(
    (item) => statSync(path.join(postsPath, item)).isDirectory() && !item.startsWith("[")
  );

  const postPreviews: Metadata[] = [];
  for (const postDirectory of postDirectories) {
    const post = await GetPost(postDirectory, false);

    if (!post.metadata.other) {
      throw new Error("Metadata is undefined");
    }

    postPreviews.push({
      ...post.metadata,
    });
  }

  return postPreviews;
}

async function LinkBox({ tag }: { tag: string }) {
  const postsData = await GetPostTags();

  const filteredPosts = postsData.filter(
    (post) => post.other && post.other.tags && Array.isArray(post.other.tags) && post.other.tags.includes(tag)
  );

  return (
    <div className="border-2 border-[#faad19] rounded-lg p-4 m-[2.5%]">
      <h2>{tag}</h2>
      <ul className="pl-4">
        {filteredPosts.length > 0 ? (
          filteredPosts.map((post: Metadata) => {
            if (!post.title || !post.other || !post.other.slug) {
              throw new Error("Metadata is undefined");
            }

            return (
              <li key={String(post.other.slug)} className="ml-2 mb-2">
                <a href={`/posts/${post.other.slug}`}>{String(post.title)}</a>
              </li>
            );
          })
        ) : (
          <p>No posts available for this tag.</p>
        )}
      </ul>
    </div>
  );
}

export default LinkBox;

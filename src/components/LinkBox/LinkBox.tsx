import { GetPost } from "@/lib/posts";
import { GetAllResearch } from "@/lib/research";
import { readdirSync, statSync } from "fs";
import { Metadata } from "next";
import path from "path";

interface LinkItem {
  metadata: Metadata;
  type: "post" | "research";
}

async function GetPostsWithType(): Promise<LinkItem[]> {
  const postsPath = path.join(process.cwd(), "src/app/posts");
  const postDirectories = readdirSync(postsPath).filter(
    (item) => statSync(path.join(postsPath, item)).isDirectory() && !item.startsWith("[")
  );

  const items: LinkItem[] = [];
  for (const postDirectory of postDirectories) {
    const post = await GetPost(postDirectory, false);

    if (!post.metadata.other) {
      throw new Error("Metadata is undefined");
    }

    items.push({
      metadata: { ...post.metadata },
      type: "post",
    });
  }

  return items;
}

async function GetResearchWithType(): Promise<LinkItem[]> {
  const research = await GetAllResearch(false);

  return research.map((item) => ({
    metadata: item.metadata,
    type: "research" as const,
  }));
}

async function LinkBox({ tag }: { tag: string }) {
  const [posts, research] = await Promise.all([GetPostsWithType(), GetResearchWithType()]);

  const allItems = [...posts, ...research];

  const filteredItems = allItems.filter(
    (item) =>
      item.metadata.other &&
      item.metadata.other.tags &&
      Array.isArray(item.metadata.other.tags) &&
      item.metadata.other.tags.includes(tag)
  );

  return (
    <div className="border-nav-background m-[2.5%] rounded-lg border-2 p-4">
      <h2>{tag}</h2>
      <ul className="pl-4">
        {filteredItems.length > 0 ? (
          filteredItems.map((item: LinkItem) => {
            if (!item.metadata.title || !item.metadata.other || !item.metadata.other.slug) {
              throw new Error("Metadata is undefined");
            }

            const href =
              item.type === "post" ? `/posts/${item.metadata.other.slug}` : `/research/${item.metadata.other.slug}`;

            return (
              <li key={String(item.metadata.other.slug)} className="mb-2 ml-2">
                <a href={href}>{String(item.metadata.title)}</a>
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

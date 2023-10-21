import styles from "./LinkBox.module.css";
import { fetcher } from "../../lib/api";

async function LinkBox({ title }) {
  const { data: postsData } = await fetcher(
    `${process.env.NEXT_PUBLIC_STRAPI_URL}/posts?filters[tags][name][$eq]=${title}`
  );
  return (
    <div className={styles.container}>
      <h2>{title}</h2>
      <ul className={styles.list}>
        {postsData && postsData.length > 0 ? (
          postsData.map((post) => (
            <li key={post.id} className={styles.listItem}>
              <a href={`/posts/${post.attributes.slug}`}>
                {post.attributes.title}
              </a>
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

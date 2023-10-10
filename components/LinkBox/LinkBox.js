import styles from "./LinkBox.module.css";
import { fetcher } from "../../lib/api";
import useSWR from "swr";

function LinkBox({ title }) {
  const { data: postsData } = useSWR(
    `${process.env.NEXT_PUBLIC_LOCAL_STRAPI_URL}/posts?filters[tags][name][$eq]=${title}`,
    fetcher
  );

  return (
    <div className={styles.container}>
      <h2>{title}</h2>
      <ul>
        {postsData && postsData.data.length > 0 ? (
          postsData.data.map((post) => (
            <li key={post.id}>
              <a href={`/content/posts/${post.attributes.slug}`}>
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

interface Post {
  id: number;
  attributes: {
    slug: string;
    title: string;
  };
}

async function LinkBox({ title }: { title: string }) {
  const postsData = await fetch(
    `${process.env.NEXT_PUBLIC_STRAPI_URL}/posts?filters[tags][name][$eq]=${title}`
  ).then((res) => res.json());
  return (
    <div>
      <h2>{title}</h2>
      <ul>
        {postsData && postsData.data.length > 0 ? (
          postsData.data.map((post: Post) => (
            <li key={post.id}>
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

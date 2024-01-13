import Link from "next/link";
import styles from "./Nav.module.css";

const navLinks = [
  {
    name: "Weltanschauung",
    path: "weltanschauung",
  },
  {
    name: "Books",
    path: "books",
  },
  {
    name: "Publications",
    path: "publications",
  },
];

function Nav() {
  return (
    <div className={styles.container}>
      <div className={styles.navItem}>
        <Link href={`/`}>
          <b>Home</b>
        </Link>
      </div>
      <div className={styles.navItem}>
        <Link href={`/post-list`}>Blog Posts</Link>
      </div>
      {navLinks.map(({ name, path }, key) => (
        <div className={styles.navItem} key={key}>
          <Link href={`/posts/${path}`}>{name}</Link>
        </div>
      ))}
      <div className={styles.navItem}>
        <Link href={`https://data-science-notes.henrydashwood.com`}>
          Data Science Notes
        </Link>
      </div>
      <div className={styles.navItem}>
        <Link href={`https://gen-ai-notes.henrydashwood.com`}>
          Data Science Notes
        </Link>
      </div>
    </div>
  );
}

export default Nav;

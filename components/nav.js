import Link from "next/link";
import styles from "./nav.module.css";

export const navLinks = [
  {
    name: "Weltanschauung",
    path: "weltanschauung",
  },
  {
    name: "Books",
    path: "books",
  },
  {
    name: "Courses",
    path: "courses",
  },
  {
    name: "Publications",
    path: "publications",
  },
  {
    name: "Notes",
    path: "notes",
  },
  {
    name: "Politics",
    path: "politics",
  },
  {
    name: "Places",
    path: "places",
  },
  {
    name: "Bioinformatics",
    path: "bioinformatics",
  },
];

export default function NavBar() {
  return (
    <div className={styles.container}>
      <Link href={`/`}>Home</Link>
      <Link href={`/post-list`}>Blog Posts</Link>
      {navLinks.map(({ name, path }, key) => (
        <Link href={`/content/things/${path}`} key={key}>
          {name}
        </Link>
      ))}
      <Link href={`https://henrydashwood.github.io/data-science-notes/`}>
        Data Science Notes
      </Link>
    </div>
  );
}

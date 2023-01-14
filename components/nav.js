import Head from "next/head";
import Image from "next/image";
import styles from "./nav.module.css";
import Link from "next/link";

export default function NavBar({ allPostsData }) {
  return (
    <div className={styles.container}>
      <Link href={`/things/Weltanschauung`}>Weltanschauung</Link>
      <Link href={`/things/books`}>Books</Link>
      <Link href={`/things/courses`}>Courses</Link>
      <Link href={`/things/publications`}>Publications</Link>
      <Link href={`/things/notes`}>Notes</Link>
      <Link href={`/things/politics`}>Politics</Link>
      <Link href={`/things/places`}>Places</Link>
      <Link href={`https://henrydashwood.github.io/data-science-notes/`}>
        Data Science Notes
      </Link>
      <Link href={`/things/bioinformatics`}>Bioinformatics</Link>
    </div>
  );
}

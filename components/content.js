import Head from "next/head";
import Link from "next/link";
import styles from "./content.module.css";

export const siteTitle = "Henry Dashwood";

export default function Content({ children, home }) {
  return (
    <div className={styles.container}>
      <Head>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>{children}</main>
      {!home && (
        <div className={styles.backToHome}>
          <Link href="/">← Back to home</Link>
        </div>
      )}
    </div>
  );
}

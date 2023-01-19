import Head from "next/head";
import styles from "./content.module.css";

export const siteTitle = "Henry Dashwood";

export default function Content({ children }) {
  return (
    <div className={styles.container}>
      <Head>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>{children}</main>
    </div>
  );
}

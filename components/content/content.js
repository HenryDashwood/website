import styles from "./Content.module.css";

export const siteTitle = "Henry Dashwood";

function Content({ children }) {
  return (
    <div className={styles.container}>
      <main>{children}</main>
    </div>
  );
}

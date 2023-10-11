import styles from "./content.module.css";

export const siteTitle = "Henry Dashwood";

export default function Content({ children }) {
  return (
    <div className={styles.container}>
      <main>{children}</main>
    </div>
  );
}

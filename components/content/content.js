import styles from "./Content.module.css";

function Content({ children }) {
  return (
    <div className={styles.container}>
      <main>{children}</main>
    </div>
  );
}

export default Content;

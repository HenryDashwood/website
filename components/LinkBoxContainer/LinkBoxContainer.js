import styles from "./LinkBoxContainer.module.css";

function LinkBoxContainer({ children }) {
  return <div className={styles.container}>{children}</div>;
}

export default LinkBoxContainer;

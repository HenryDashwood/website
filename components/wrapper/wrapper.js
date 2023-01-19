import styles from "./wrapper.module.css";

export default function Wrapper({ children }) {
  return <div className={styles.wrapper}>{children}</div>;
}

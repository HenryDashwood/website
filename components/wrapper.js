import Head from "next/head";
import Image from "next/image";
import styles from "./wrapper.module.css";
import Link from "next/link";

export default function Wrapper({ children }) {
  return <div className={styles.wrapper}>{children}</div>;
}

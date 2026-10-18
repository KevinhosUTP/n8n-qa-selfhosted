import styles from "./shared-ui.module.css";
/** Decorative original placeholder; caller owns aria-busy and the loading message. */
export function Skeleton() {
  return <div className={styles.skeleton} aria-hidden="true"><span /><span /><span /></div>;
}

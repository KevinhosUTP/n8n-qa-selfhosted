import { motors } from "@/lib/content/public/content";
import { PublicIcon } from "./PublicIcon";
import styles from "./public-content.module.css";
export function QAMotorCards() {
  return <ul className={styles.motors}>{motors.map((motor) => <li key={motor.id} className={[styles.card, styles.motor].join(" ")}><PublicIcon name={motor.icon}/><h3 className={styles.cardTitle}>{motor.title}</h3><p className={styles.muted}>{motor.description}</p></li>)}</ul>;
}

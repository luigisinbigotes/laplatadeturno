"use client";

import { useEffect, useState } from "react";
import styles from "./splash-screen.module.css";

export default function SplashScreen() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setVisible(false);
    }, 1400);

    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div className={styles.overlay} aria-hidden="true">
      <div className={styles.card}>
        <div className={styles.mark}>
          <span className={styles.crossVertical} />
          <span className={styles.crossHorizontal} />
        </div>
        <p className={styles.kicker}>LA PLATA</p>
        <h1 className={styles.title}>DE TURNO</h1>
        <p className={styles.subtle}>FARMACIAS CERCANAS DEL DIA</p>
      </div>
    </div>
  );
}

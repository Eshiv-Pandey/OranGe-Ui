"use client";

import { useEffect, useRef, useState } from "react";
import styles from "../../../styles/portfolio-favicon.module.css";

export function FooterFavicon({ src = "/portfolio/favicon-red.png", paused = false }: { src?: string; paused?: boolean }) {
  const stage = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = stage.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.5 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <span ref={stage} className={styles.stage} data-visible={visible} data-paused={paused} aria-hidden="true">
      <span className={styles.character}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" width={64} height={64} className={styles.face} />
        <span className={`${styles.pupil} ${styles.left}`} />
        <span className={`${styles.pupil} ${styles.right}`} />
      </span>
      <span className={styles.shadow} />
    </span>
  );
}

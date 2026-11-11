import type { ReactNode, CSSProperties } from "react";
import { cn } from "../../../lib/utils";
import styles from "../../../styles/portfolio-social.module.css";

const SHAPE = "M17 6C24 4 31 7 36 5C45 5 53 7 57 13C61 20 59 26 60 33C61 42 60 49 54 54C48 60 40 59 32 59L17 58C9 58 5 53 5 44L4 28C4 20 8 9 17 6Z";

export function StickerTile({ appearance, children, style }: { appearance: string; children: ReactNode; style?: CSSProperties }) {
  return (
    <span className={cn(styles.tile, styles[appearance])} style={style}>
      <svg aria-hidden="true" viewBox="0 0 64 64" className={styles.sticker}>
        <path className={styles.cutline} d={SHAPE} />
        <path className={styles.fill} d={SHAPE} />
        <path className={styles.shade} d="M8 43C11 50 17 53 26 53L42 54C51 54 57 49 59 43C58 50 54 57 46 58L18 57C11 57 7 53 8 43Z" />
        <path className={styles.outline} d={SHAPE} />
        <path className={styles.highlight} d="M12 22C14 14 18 12 24 10M10 30L10 35M52 46C50 50 47 52 43 53M54 16L56 23" />
      </svg>
      {children}
    </span>
  );
}

"use client";
import type { ComponentType, CSSProperties, SVGProps } from "react";
import type { AppearanceProps } from "./appearance";
import { useCreativeTheme, type CreativeTheme } from "./creative-surface";
import { StickerTile } from "./portfolio/sticker-tile";
import SocialHoverCard, { type SocialProfile } from "./portfolio/social-hover-card";
import styles from "../../styles/portfolio-social.module.css";
import "../../styles/portfolio.css";

export type StickerProfile = {
  name: string; href: string; Icon: ComponentType<SVGProps<SVGSVGElement>>;
  appearance: "github" | "linkedin" | "medium" | "leetcode" | "x" | "email" | "contact" | "resume" | string;
  label?: string; ariaLabel?: string; target?: "_blank" | "_self"; hoverCard?: SocialProfile;
  color?: string; shade?: string; markColor?: string; rotation?: number;
};
export type StickerSocialIconsProps = AppearanceProps & {
  profiles: readonly StickerProfile[]; showLabels?: boolean; label?: string; theme?: CreativeTheme;
};
export function StickerSocialIcons({ profiles, showLabels = true, label = "Social profiles", theme = "auto", appearance = "polished", className }: StickerSocialIconsProps) {
  const resolved = useCreativeTheme(theme);
  return <nav aria-label={label} className={["portfolio-scope", styles.links, className].filter(Boolean).join(" ")} data-theme={resolved} data-appearance={appearance}>
    {profiles.map(({ name, href, Icon, appearance: tileAppearance, label: text, ariaLabel, target = "_blank", hoverCard, color, shade, markColor, rotation }) => <SocialHoverCard key={name} profile={hoverCard} theme={resolved}>
      <a href={href} target={target} rel={target === "_blank" ? "noopener noreferrer" : undefined} aria-label={ariaLabel ?? `${name} profile`} className={styles.link}>
        <StickerTile appearance={tileAppearance} style={{ ...(color ? { "--sticker-color": color } : {}), ...(shade ? { "--sticker-shade": shade } : {}), ...(markColor ? { "--mark-color": markColor } : {}), ...(rotation !== undefined ? { "--tilt": `${rotation}deg` } : {}) } as CSSProperties}><Icon aria-hidden="true" className={styles.mark} /></StickerTile>
        {showLabels && <span className={styles.label}>{text ?? name}</span>}
      </a>
    </SocialHoverCard>)}
  </nav>;
}

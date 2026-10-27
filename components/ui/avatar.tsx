import { useId, type CSSProperties } from "react";
import { DEFAULT_AVATAR_SEED, generateAvatarConfig, normalizeAvatarConfig } from "../../lib/avatar/generator";
import { avatarSvgBody } from "../../lib/avatar/render";
import type { AvatarConfig, AvatarShape } from "../../lib/avatar/types";
import { uiClass, type AppearanceProps } from "./appearance";
import "../../styles/avatar.css";

export const AVATAR_SIZES = { xs: 24, sm: 32, md: 48, lg: 72, xl: 112 } as const;
export type AvatarSize = keyof typeof AVATAR_SIZES | number;

export type AvatarProps = AppearanceProps & {
  /** A stable user ID or other non-secret identifier. Used when config is absent. */
  seed?: string;
  /** Saved display data takes priority over seed. */
  config?: AvatarConfig;
  size?: AvatarSize;
  shape?: AvatarShape;
  name?: string;
  status?: "online" | "away" | "offline";
  "aria-label"?: string;
};

export function avatarSizePixels(size: AvatarSize = "md"): number {
  if (typeof size === "number") return Number.isFinite(size) ? Math.min(2048, Math.max(12, size)) : AVATAR_SIZES.md;
  return AVATAR_SIZES[size] ?? AVATAR_SIZES.md;
}

/** Inline SVG that also renders in synchronous React Server Components. */
export function Avatar({ appearance = "polished", className, seed, config, size = "md", shape, name, status, "aria-label": ariaLabel }: AvatarProps) {
  const id = useId();
  const value = config ? normalizeAvatarConfig(config) : generateAvatarConfig(seed ?? name ?? DEFAULT_AVATAR_SEED);
  const pixels = avatarSizePixels(size);
  const label = ariaLabel?.trim() || `${name?.trim() || "Generated profile avatar"}${status ? `, ${status}` : ""}`;
  const statusColors = { online: "#20b878", away: "#f5b62b", offline: "#888888" } as const;
  const presence = status ? appearance === "pixel"
    ? `<rect x="76" y="76" width="20" height="20" fill="${statusColors[status]}" stroke="var(--surface, #ffffff)" stroke-width="4"/>`
    : `<circle cx="86" cy="86" r="10" fill="${statusColors[status]}" stroke="var(--surface, #ffffff)" stroke-width="4"/>` : "";

  return <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 100 100"
    width={pixels}
    height={pixels}
    role="img"
    aria-label={label}
    className={uiClass("ui-avatar", className)}
    data-generated-avatar=""
    data-appearance={appearance}
    data-shape={shape ?? value.shape}
    data-size={size}
    style={{ "--avatar-size": `${pixels}px` } as CSSProperties}
    dangerouslySetInnerHTML={{ __html: avatarSvgBody(value, `avatar-${id}`, { shape, appearance }) + presence }}
  />;
}

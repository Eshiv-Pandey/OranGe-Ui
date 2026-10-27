import type { CSSProperties } from "react";
import { Avatar, avatarSizePixels, type AvatarProps, type AvatarSize } from "./avatar";
import { uiClass, type AppearanceProps } from "./appearance";
import "../../styles/avatar.css";

export type AvatarGroupProps = AppearanceProps & {
  avatars: readonly (string | AvatarProps)[];
  max?: number;
  size?: AvatarSize;
  label?: string;
};

export function AvatarGroup({ avatars, max = 5, size = "md", label = "People", appearance = "polished", className }: AvatarGroupProps) {
  const limit = Number.isFinite(max) ? Math.max(0, Math.floor(max)) : 5;
  const visible = avatars.slice(0, limit);
  const remaining = avatars.length - visible.length;
  return <div
    className={uiClass("avatar-group", className)}
    data-appearance={appearance}
    role="group"
    aria-label={`${label}: ${avatars.length} ${avatars.length === 1 ? "person" : "people"}`}
    style={{ "--avatar-size": `${avatarSizePixels(size)}px` } as CSSProperties}
  >
    {visible.map((item, index) => {
      const props = typeof item === "string" ? { seed: item, name: item } : item;
      return <span className="avatar-group-member" key={index} style={{ zIndex: visible.length - index }}>
        <Avatar {...props} appearance={appearance} size={size} />
      </span>;
    })}
    {remaining > 0 && <span className="avatar-group-overflow" role="img" aria-label={`${remaining} more ${remaining === 1 ? "person" : "people"}`}>+{remaining}</span>}
    {avatars.length === 0 && <span className="ui-help">No people yet.</span>}
  </div>;
}

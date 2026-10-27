"use client";
import { Avatar as Primitive } from "radix-ui";
import { uiClass, type AppearanceProps } from "./appearance";
import "../../styles/library-components.css";
export type AvatarProps = AppearanceProps & { name: string; src?: string; size?: "sm" | "md" | "lg"; status?: "online" | "away" | "offline" };
export function Avatar({ appearance = "polished", className, name, src, size = "md", status }: AvatarProps) {
  const initials = name.trim().split(/\s+/).slice(0, 2).map((word) => word[0]).join("").toUpperCase();
  return <Primitive.Root className={uiClass("ui-avatar", className)} data-appearance={appearance} data-size={size} role="img" aria-label={name + (status ? ", " + status : "")}>
    {src && <Primitive.Image src={src} alt="" className="ui-avatar-image" />}
    <Primitive.Fallback className="ui-avatar-fallback" aria-hidden="true">{initials || "?"}</Primitive.Fallback>
    {status && <span className="ui-avatar-status" data-status={status} aria-hidden="true" />}
  </Primitive.Root>;
}

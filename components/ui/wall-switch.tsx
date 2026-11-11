"use client";

import { useEffect, useId, useRef, type ComponentPropsWithoutRef, type CSSProperties } from "react";
import { Switch as Primitive } from "radix-ui";
import { uiClass, type AppearanceProps } from "./appearance";
import "../../styles/wall-switch.css";

export type WallSwitchProps = Omit<ComponentPropsWithoutRef<typeof Primitive.Root>, "children" | "className"> & AppearanceProps & {
  label: string;
  description?: string;
  size?: number;
};

/** A household rocker, with native switch semantics and form support. */
export function WallSwitch({ label, description, size = 152, appearance = "polished", className, id, "aria-describedby": describedBy, ...props }: WallSwitchProps) {
  const uid = useId(), fieldId = id ?? uid;
  const button = useRef<HTMLButtonElement>(null), canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const target = button.current, image = canvas.current;
    if (!target || !image || appearance !== "polished") return;
    let cancelled = false, dispose: (() => void) | undefined;
    void import("./wall-switch-renderer").then(module => cancelled ? undefined : module.createWallSwitchRenderer(image, target)).then(renderer => {
      if (!renderer) return;
      if (cancelled) renderer.destroy(); else dispose = () => renderer.destroy();
    }).catch(() => { target.dataset.renderer = "fallback"; });
    return () => { cancelled = true; dispose?.(); };
  }, [appearance]);
  const details = [describedBy, description && `${fieldId}-help`].filter(Boolean).join(" ") || undefined;
  return <div className={uiClass("wall-switch-field", className)} data-appearance={appearance} data-disabled={props.disabled || undefined}>
    <Primitive.Root {...props} ref={button} id={fieldId} aria-describedby={details} className="wall-switch" style={{ "--wall-switch-size": `${Number.isFinite(size) ? Math.max(96, Math.min(240, size)) : 152}px` } as CSSProperties}>
      {appearance === "polished" && <canvas ref={canvas} className="wall-switch-canvas" aria-hidden="true" />}
      <span className="wall-switch-recess" aria-hidden="true"><span className="wall-switch-rocker"><span className="wall-switch-on">I</span><span className="wall-switch-indicator" /><span className="wall-switch-off">O</span></span></span>
    </Primitive.Root>
    <label htmlFor={fieldId}>{label}</label>
    {description && <p id={`${fieldId}-help`} className="ui-help">{description}</p>}
  </div>;
}

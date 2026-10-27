"use client";
import { useState, type ReactNode } from "react";
import { uiClass, type AppearanceProps } from "./appearance";
import { CloseIcon } from "./symbols";
import "../../styles/library-components.css";
export type AlertProps = AppearanceProps & { title: string; children?: ReactNode; tone?: "info" | "success" | "warning" | "danger"; dismissible?: boolean; onDismiss?: () => void };
export function Alert({ appearance = "polished", className, title, children, tone = "info", dismissible = false, onDismiss }: AlertProps) {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;
  return <div className={uiClass("ui-alert ui-surface", className)} data-appearance={appearance} data-tone={tone} role={tone === "danger" ? "alert" : "status"}>
    <span className="ui-alert-symbol" aria-hidden="true">{tone === "success" ? "✓" : tone === "info" ? "i" : "!"}</span>
    <div><p className="ui-alert-title">{title}</p>{children && <div className="ui-help">{children}</div>}</div>
    {dismissible && <button type="button" className="ui-icon-button" aria-label="Dismiss alert" onClick={() => { setVisible(false); onDismiss?.(); }}><CloseIcon /></button>}
  </div>;
}

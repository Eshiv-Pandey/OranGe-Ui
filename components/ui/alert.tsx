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
    <span className="ui-alert-symbol" aria-hidden="true"><svg viewBox="0 0 24 24">{tone === "success" ? <><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></> : tone === "warning" ? <><path d="M12 3 2 20h20Z" /><path d="M12 9v5m0 3h.01" /></> : <><circle cx="12" cy="12" r="9" /><path d={tone === "danger" ? "m9 9 6 6m0-6-6 6" : "M12 11v6m0-10h.01"} /></>}</svg></span>
    <div><p className="ui-alert-title">{title}</p>{children && <div className="ui-help">{children}</div>}</div>
    {dismissible && <button type="button" className="ui-icon-button" aria-label="Dismiss alert" onClick={() => { setVisible(false); onDismiss?.(); }}><CloseIcon /></button>}
  </div>;
}

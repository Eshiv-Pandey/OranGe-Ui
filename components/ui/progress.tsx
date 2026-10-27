import { useId, type ComponentPropsWithoutRef } from "react";
import { uiClass, type AppearanceProps } from "./appearance";
import "../../styles/library-components.css";
export type ProgressProps = Omit<ComponentPropsWithoutRef<"div">, "children"> & AppearanceProps & { label: string; value?: number; max?: number; showValue?: boolean };
export function Progress({ appearance = "polished", className, label, value, max = 100, showValue = true, ...props }: ProgressProps) {
  const id = useId(); const maximum = Number.isFinite(max) && max > 0 ? max : 100;
  const current = value === undefined || !Number.isFinite(value) ? undefined : Math.max(0, Math.min(maximum, value));
  const percent = current === undefined ? undefined : Math.round(current / maximum * 100);
  return <div className={uiClass("ui-progress", className)} data-appearance={appearance}>
    <div className="ui-progress-label"><span id={id}>{label}</span>{showValue && <span>{percent === undefined ? "Working..." : percent + "%"}</span>}</div>
    <div {...props} className="ui-progress-track" role="progressbar" aria-labelledby={id} aria-valuemin={0} aria-valuemax={maximum} aria-valuenow={current} data-indeterminate={current === undefined || undefined}><span className="ui-progress-bar" style={{ width: percent === undefined ? "35%" : percent + "%" }} /></div>
  </div>;
}

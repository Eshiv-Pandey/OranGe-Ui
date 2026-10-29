"use client";

import { useRef, useState } from "react";
import { uiClass, type AppearanceProps } from "./appearance";
import "../../styles/launch-forms.css";

export type StepperStep = { id: string; label: string; description?: string; disabled?: boolean };
export type StepperProps = AppearanceProps & {
  steps: readonly StepperStep[]; value?: number; defaultValue?: number; onValueChange?: (index: number) => void;
  orientation?: "horizontal" | "vertical"; interactive?: boolean; maxUnlockedStep?: number; label?: string;
};
/** Zero-based step progress. Native navigation is opt-in, with arrow-key shortcuts. */
export function Stepper({ steps, value, defaultValue = 0, onValueChange, orientation = "horizontal", interactive = false, maxUnlockedStep = steps.length - 1, label = "Progress", appearance = "polished", className }: StepperProps) {
  const [internal, setInternal] = useState(defaultValue), buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const current = Math.max(0, Math.min(steps.length - 1, Math.floor(value ?? internal) || 0));
  const available = (index: number) => index >= 0 && index < steps.length && index <= maxUnlockedStep && !steps[index].disabled;
  function choose(index: number) { if (!interactive || !available(index)) return; if (value === undefined) setInternal(index); onValueChange?.(index); }
  return <nav className={uiClass("ui-stepper", className)} data-appearance={appearance} data-orientation={orientation} aria-label={label}>
    <ol>{steps.map((step, index) => { const content = <><span className="ui-stepper-marker" aria-hidden="true">{index < current ? <svg viewBox="0 0 20 20"><path d="m4 10 4 4 8-8"/></svg> : index + 1}</span><span className="ui-stepper-copy"><strong>{step.label}</strong>{step.description && <small>{step.description}</small>}<span className="sr-only">{index < current ? ", completed" : index === current ? ", current step" : ", upcoming"}</span></span></>;
      return <li key={step.id} data-state={index < current ? "complete" : index === current ? "current" : "upcoming"}>{interactive ? <button ref={(node) => { buttons.current[index] = node; }} type="button" className="ui-stepper-step" disabled={!available(index)} aria-current={index === current ? "step" : undefined} onClick={() => choose(index)} onKeyDown={(event) => {
        const direction = event.key === (orientation === "horizontal" ? "ArrowRight" : "ArrowDown") ? 1 : event.key === (orientation === "horizontal" ? "ArrowLeft" : "ArrowUp") ? -1 : 0;
        if (!direction && event.key !== "Home" && event.key !== "End") return;
        event.preventDefault(); const candidates = steps.map((_, candidate) => candidate).filter(available);
        const next = event.key === "Home" ? candidates[0] : event.key === "End" ? candidates.at(-1) : candidates[(candidates.indexOf(index) + direction + candidates.length) % candidates.length];
        if (next !== undefined) buttons.current[next]?.focus();
      }}>{content}</button> : <div className="ui-stepper-step" aria-current={index === current ? "step" : undefined}>{content}</div>}</li>;
    })}</ol>
  </nav>;
}

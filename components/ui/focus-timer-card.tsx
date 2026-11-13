"use client";
import { useEffect, useRef, useState } from "react";
import { Timer } from "lucide-react";
import { Button } from "./button";
import { CardField, CardFrame, CardNumber, useCardValue } from "./adaptive/card-ui";
import { ADAPTIVE_SAMPLE_DATA } from "./adaptive/samples";
import type { AdaptiveCardProps, FocusTimerData } from "./adaptive/types";
export type FocusTimerCardProps = Omit<AdaptiveCardProps<FocusTimerData>, "onSubmit"> & { onComplete?: (value: FocusTimerData) => void };
export function FocusTimerCard(props: FocusTimerCardProps) {
  const [value, setValue] = useCardValue(props, ADAPTIVE_SAMPLE_DATA.timer), { disabled, editable = true, appearance = "polished", className } = props;
  const duration = Math.max(0, Math.min(86400, Math.round(Number.isFinite(value.seconds) ? value.seconds : 0)));
  const [session, setSession] = useState({ duration, remaining: duration, deadline: null as number | null });
  if (session.duration !== duration) setSession({ duration, remaining: duration, deadline: null });
  const completed = useRef<number | null>(null), latest = useRef({ value, onComplete: props.onComplete });
  useEffect(() => { latest.current = { value, onComplete: props.onComplete }; }, [value, props.onComplete]);
  useEffect(() => {
    if (session.deadline === null) return;
    const deadline = session.deadline;
    const tick = () => { const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000)); setSession(previous => previous.deadline === deadline ? { ...previous, remaining, deadline: remaining ? deadline : null } : previous); if (!remaining && completed.current !== deadline) { completed.current = deadline; latest.current.onComplete?.(latest.current.value); } };
    const interval = window.setInterval(tick, 250); document.addEventListener("visibilitychange", tick);
    return () => { window.clearInterval(interval); document.removeEventListener("visibilitychange", tick); };
  }, [session.deadline]);
  const remaining = session.duration === duration ? session.remaining : duration;
  const clock = String(Math.floor(remaining / 60)).padStart(2, "0") + ":" + String(remaining % 60).padStart(2, "0");
  return <CardFrame title="Focus timer" kind="timer" icon={<Timer aria-hidden="true" />} appearance={appearance} className={className} disabled={disabled}>
    <CardField label="Session title" value={value.title} disabled={disabled} readOnly={!editable} onChange={event => setValue({ ...value, title: event.target.value })} />
    <output className="adaptive-timer" aria-label="Time remaining">{clock}</output>
    <CardNumber label="Duration in minutes" min={0} max={1440} step={.5} value={Number.isFinite(value.seconds) ? duration / 60 : Number.NaN} disabled={disabled || session.deadline !== null} readOnly={!editable} onValueChange={minutes => setValue({ ...value, seconds: Math.max(0, Math.min(86400, Math.round(minutes * 60))) })} />
    <div className="adaptive-actions"><Button appearance={appearance} disabled={disabled || duration === 0} onClick={() => setSession(previous => previous.deadline !== null ? { ...previous, remaining: Math.max(0, Math.ceil((previous.deadline - Date.now()) / 1000)), deadline: null } : { ...previous, remaining: previous.remaining || duration, deadline: Date.now() + (previous.remaining || duration) * 1000 })}>{session.deadline !== null ? "Pause" : remaining === 0 ? "Start again" : "Start"}</Button><Button appearance={appearance} variant="secondary" disabled={disabled} onClick={() => setSession({ duration, remaining: duration, deadline: null })}>Reset</Button></div>
    <p className="adaptive-summary" role="status">{duration === 0 ? "Enter a duration to start." : remaining === 0 ? "Session complete." : session.deadline !== null ? "Timer running." : "Ready when you are."}</p>
  </CardFrame>;
}

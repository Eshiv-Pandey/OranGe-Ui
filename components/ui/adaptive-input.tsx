"use client";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Button } from "./button";
import type { AppearanceProps } from "./appearance";
import { AdaptiveCardRenderer } from "./adaptive/render-card";
import { ADAPTIVE_KINDS, ADAPTIVE_LABELS, type AdaptiveClassifier, type AdaptiveIntent, type AdaptiveKind, type AdaptiveRenderers } from "./adaptive/types";
import { isAdaptiveIntent, parseAdaptiveInput, validDate } from "./adaptive/parser";
import { calculateExpression, convertUnit, parseColor, safeBookmarkUrl } from "./adaptive/math";
import "../../styles/adaptive-cards.css";
export { parseAdaptiveInput, isAdaptiveIntent } from "./adaptive/parser";
export { ADAPTIVE_KINDS, ADAPTIVE_LABELS } from "./adaptive/types";
export type { AdaptiveClassifier, AdaptiveIntent, AdaptiveKind, AdaptiveRenderers } from "./adaptive/types";
export type AdaptiveInputProps = AppearanceProps & {
  value?: string; defaultValue?: string; onValueChange?: (value: string) => void; onIntentChange?: (intent: AdaptiveIntent | null) => void; onSave?: (intent: AdaptiveIntent) => void;
  classifier?: AdaptiveClassifier; debounceMs?: number; enabledKinds?: readonly AdaptiveKind[]; renderers?: AdaptiveRenderers; now?: Date; currency?: string;
  initialIntent?: AdaptiveIntent;
  label?: string; placeholder?: string; disabled?: boolean; animateTransitions?: boolean; showTypePicker?: boolean;
};
export function intentReady(intent: AdaptiveIntent): boolean {
  if (!isAdaptiveIntent(intent)) return false;
  switch (intent.kind) {
    case "event": return Boolean(intent.data.title.trim() && validDate(intent.data.date) && /^([01]\d|2[0-3]):[0-5]\d$/.test(intent.data.time));
    case "reminder": return Boolean(intent.data.title.trim());
    case "checklist": return intent.data.items.length > 0 && intent.data.items.every(item => item.text.trim());
    case "timer": return intent.data.seconds > 0;
    case "color": return parseColor(intent.data.color) !== null;
    case "split": return intent.data.amount >= 0 && Number.isFinite(intent.data.amount) && Number.isInteger(intent.data.people) && intent.data.people > 0 && intent.data.people <= 100000;
    case "convert": return convertUnit(intent.data.amount, intent.data.from, intent.data.to).value !== null;
    case "calculate": return calculateExpression(intent.data.expression).value !== null;
    case "poll": return intent.data.options.length >= 2 && intent.data.options.every(option => option.label.trim());
    case "bookmark": return safeBookmarkUrl(intent.data.url) !== null;
    case "note": return Boolean(intent.data.text.trim());
  }
}
function manualIntent(kind: AdaptiveKind, text: string, currency: string, detected: AdaptiveIntent | null): AdaptiveIntent {
  const confidence = 1, explanation = text.trim()
    ? "This request does not match " + ADAPTIVE_LABELS[kind] + ". Fill in its details below, or return to automatic detection."
    : "Fill in the " + ADAPTIVE_LABELS[kind].toLowerCase() + " details below.";
  const clean = text.trim();
  switch (kind) {
    case "event": return { kind, confidence, explanation, data: { title: "", date: "", time: "", location: "", attendees: [] } };
    case "reminder": return { kind, confidence, explanation, data: { title: "", due: "", priority: "normal", completed: false } };
    case "checklist": {
      // A plain list can be interpreted manually; event attendees and places cannot.
      const items = detected?.kind === "note" && /[,;\n]/.test(clean)
        ? clean.split(/,|;|\n/).map(text => text.replace(/^\s*[-*]\s+/, "").trim()).filter(Boolean)
        : [];
      return { kind, confidence, explanation: items.length > 1 ? "List items extracted from your text. Check them before using the card." : explanation, data: { title: "", items: items.length > 1 ? items.slice(0, 100).map((text, index) => ({ id: "item-" + index, text, checked: false })) : [] } };
    }
    case "timer": return { kind, confidence, explanation, data: { title: "", seconds: Number.NaN } };
    case "color": return { kind, confidence, explanation, data: { color: "", name: "" } };
    case "split": return { kind, confidence, explanation, data: { amount: Number.NaN, people: Number.NaN, currency } };
    case "convert": return { kind, confidence, explanation, data: { amount: Number.NaN, from: "m", to: "km" } };
    case "calculate": return { kind, confidence, explanation: calculateExpression(clean).value !== null ? "Check the calculation before using its result." : explanation, data: { expression: calculateExpression(clean).value !== null ? clean : "" } };
    case "poll": return { kind, confidence, explanation, data: { question: "", options: [] } };
    case "bookmark": return { kind, confidence, explanation, data: { url: "", title: "", description: "" } };
    case "note": return { kind, confidence, explanation: "Your original text is kept as a note.", data: { title: "", text } };
  }
}
export function AdaptiveInput({ value, defaultValue = "", onValueChange, onIntentChange, onSave, classifier, debounceMs = 220, enabledKinds = ADAPTIVE_KINDS, renderers, now, currency = "USD", initialIntent, label = "Describe what you need", placeholder = "Try dinner with friends Friday 8pm", disabled = false, animateTransitions = true, showTypePicker = true, appearance = "polished", className }: AdaptiveInputProps) {
  const [local, setLocal] = useState(defaultValue), text = value ?? local, id = useId(), [initialNow] = useState(() => new Date());
  const timestamp = now && Number.isFinite(now.getTime()) ? now.getTime() : initialNow.getTime();
  const referenceNow = useMemo(() => new Date(timestamp), [timestamp]);
  const kindKey = enabledKinds.filter(kind => ADAPTIVE_KINDS.includes(kind)).join(",");
  const allowedKinds = useMemo(() => ADAPTIVE_KINDS.filter(kind => kindKey.split(",").includes(kind)), [kindKey]);
  const [selection, setSelection] = useState<{ kind: AdaptiveKind | "auto"; text: string }>(() => ({ kind: initialIntent && isAdaptiveIntent(initialIntent) ? initialIntent.kind : "auto", text })), [feedback, setFeedback] = useState("");
  const [drafts, setDrafts] = useState<Partial<Record<AdaptiveKind, { text: string; intent: AdaptiveIntent }>>>(() => initialIntent && isAdaptiveIntent(initialIntent) ? { [initialIntent.kind]: { text, intent: initialIntent } } : {});
  if (selection.text !== text) { setSelection({ kind: "auto", text }); setDrafts({}); }
  const [remote, setRemote] = useState<{ text: string; status: "loading" | "ready" | "error"; intent?: AdaptiveIntent }>({ text: "", status: "loading" });
  const reduced = useReducedMotion(), quiet = reduced || !animateTransitions;
  const offline = useMemo(() => parseAdaptiveInput(text, { now: referenceNow, currency, enabledKinds: allowedKinds }), [text, referenceNow, currency, allowedKinds]);
  const inferred = classifier && remote.text === text && remote.status === "ready" && remote.intent && allowedKinds.includes(remote.intent.kind) && remote.intent.confidence >= .8 ? remote.intent : offline;
  const effectiveForced = selection.text === text && (selection.kind === "auto" || allowedKinds.includes(selection.kind)) ? selection.kind : "auto";
  const chosen = useMemo(() => effectiveForced === "auto" || inferred?.kind === effectiveForced ? inferred : manualIntent(effectiveForced, text, currency, inferred), [effectiveForced, inferred, text, currency]);
  const intent = chosen && drafts[chosen.kind]?.text === text ? drafts[chosen.kind]!.intent : chosen;
  const callbacks = useRef({ onIntentChange });
  useEffect(() => { callbacks.current = { onIntentChange }; }, [onIntentChange]);
  useEffect(() => { callbacks.current.onIntentChange?.(intent); }, [intent]);
  useEffect(() => {
    if (!classifier || disabled || !text.trim()) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setRemote({ text, status: "loading" });
      void Promise.resolve().then(() => classifier(text, { signal: controller.signal, now: referenceNow })).then(result => {
        if (controller.signal.aborted) return; if (!isAdaptiveIntent(result)) throw new Error("Invalid classifier result."); setRemote({ text, status: "ready", intent: result });
      }).catch(() => { if (!controller.signal.aborted) setRemote({ text, status: "error" }); });
    }, Math.max(0, Math.min(2000, Number.isFinite(debounceMs) ? debounceMs : 220)));
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, [text, classifier, referenceNow, debounceMs, disabled]);
  function changeText(next: string) { if (value === undefined) setLocal(next); onValueChange?.(next); if (next !== text) { setDrafts({}); setSelection({ kind: "auto", text: next }); } setFeedback(""); }
  function save(next = intent) { if (!next || !intentReady(next) || disabled) { setFeedback("Complete the card details first."); return; } onSave?.(next); setFeedback("Card ready to use."); }
  function clear() { changeText(""); setSelection({ kind: "auto", text: "" }); setDrafts({}); }
  return <section className={["adaptive-input ui", className].filter(Boolean).join(" ")} data-appearance={appearance} data-intent={intent?.kind ?? "empty"} data-classifier={classifier && remote.text === text ? remote.status : "offline"} aria-label="Adaptive input">
    <div className="adaptive-prompt"><label htmlFor={id}>{label}</label><textarea id={id} rows={2} value={text} disabled={disabled} maxLength={4000} placeholder={placeholder} onChange={event => changeText(event.target.value)} onKeyDown={event => { if (event.nativeEvent.isComposing) return; if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); save(); } else if (event.key === "Escape") { event.preventDefault(); clear(); } }} /></div>
    {showTypePicker && <div className="adaptive-type-row"><label htmlFor={id + "-kind"}>Card type</label><select id={id + "-kind"} value={effectiveForced} disabled={disabled} onChange={event => { setSelection({ kind: event.target.value as AdaptiveKind | "auto", text }); setFeedback(""); }}><option value="auto">Detect automatically</option>{allowedKinds.map(kind => <option key={kind} value={kind}>{ADAPTIVE_LABELS[kind]}</option>)}</select></div>}
    {classifier && remote.text === text && remote.status === "error" && <p className="adaptive-summary" role="status">Classifier unavailable. Using offline interpretation.</p>}
    <div className="adaptive-card-slot" aria-live="off"><AnimatePresence initial={false} mode="wait">{intent && <motion.div key={intent.kind} initial={quiet ? false : { opacity: .6, y: 6, filter: "blur(2px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={quiet ? { opacity: 1 } : { opacity: .5, y: -4, filter: "blur(2px)" }} transition={{ duration: quiet ? 0 : .18, ease: [.16, 1, .3, 1] }}><AdaptiveCardRenderer showSubmit={false} intent={intent} appearance={appearance} disabled={disabled} renderers={renderers} onChange={next => setDrafts(previous => ({ ...previous, [next.kind]: { text, intent: next } }))} onSubmit={save} /></motion.div>}</AnimatePresence></div>
    {!intent && <p className="adaptive-empty">Type a task, a list, a duration, a color or a calculation.</p>}
    {intent?.explanation && <p className="adaptive-summary">{intent.explanation}</p>}
    <div className="adaptive-input-footer">{intent && <Button appearance={appearance} disabled={disabled || !intentReady(intent)} onClick={() => save()}>Use card</Button>}{text && <Button appearance={appearance} variant="ghost" disabled={disabled} onClick={clear}>Clear</Button>}<span className="adaptive-summary">Enter to use. Shift+Enter for a new line.</span></div>
    <p className="adaptive-feedback" role="status">{feedback || (intent ? ADAPTIVE_LABELS[intent.kind] + " card" : "")}</p>
  </section>;
}

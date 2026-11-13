"use client";
import { useRef, useState } from "react";
import { Button } from "../ui/button";
import { CustomizerSelect, CustomizerToggle } from "../ui/artwork-customizer";
import { WorkbenchInspector } from "../ui/workbench-inspector";
import { AdaptiveInput } from "../ui/adaptive-input";
import { AdaptiveCardRenderer } from "../ui/adaptive/render-card";
import { ADAPTIVE_EXAMPLES, ADAPTIVE_SAMPLE_DATA } from "../ui/adaptive/samples";
import { ADAPTIVE_KINDS, ADAPTIVE_LABELS, type AdaptiveClassifier, type AdaptiveIntent, type AdaptiveKind } from "../ui/adaptive/types";
import { parseAdaptiveInput } from "../ui/adaptive/parser";
import type { Appearance } from "../ui/appearance";
import { ADAPTIVE_STANDALONE_CARD_SPECS } from "../../lib/adaptive-components";
import "../../styles/adaptive-demos.css";
const sampleClassifier: AdaptiveClassifier = (text, { signal, now }) => new Promise((resolve, reject) => {
  const timer = window.setTimeout(() => { signal.removeEventListener("abort", abort); const result = parseAdaptiveInput(text, { now, currency: "INR" }); if (result) resolve(result); else reject(new Error("No input.")); }, 350);
  function abort() { window.clearTimeout(timer); reject(new DOMException("Aborted", "AbortError")); }
  signal.addEventListener("abort", abort, { once: true }); if (signal.aborted) abort();
});
function sample(kind: AdaptiveKind, seed = 0): AdaptiveIntent {
  const data = JSON.parse(JSON.stringify(ADAPTIVE_SAMPLE_DATA[kind]));
  if (kind === "color") data.color = ["#4aedd9", "#ff6a00", "#8b5cf6", "#14b8a6"][seed % 4];
  if (kind === "split") { data.amount = [2400, 1800, 3600, 1200][seed % 4]; data.people = 3 + seed % 3; }
  if (kind === "timer") data.seconds = [1500, 900, 2700][seed % 3];
  if (kind === "calculate") data.expression = ["18% of 3450", "(48 + 12) / 3", "250 * 1.18"][seed % 3];
  if (kind === "convert") data.amount = [5, 12, 2.5][seed % 3];
  if (kind === "event") data.title = ["Dinner with friends", "Design review", "Coffee and catch-up"][seed % 3];
  if (kind === "note") data.text = ["Make the first interaction useful. Keep the rest simple.", "Try a smaller first release with clearer controls.", "Capture the idea before polishing it."][seed % 3];
  if (kind === "reminder") data.title = ["Pay rent", "Review the draft", "Book an appointment"][seed % 3];
  if (kind === "checklist" && seed) data.items = ["Sketch", "Build", "Review", "Ship"].map((text, index) => ({ id: "item-" + index, text, checked: index < seed % 4 }));
  if (kind === "poll" && seed) { data.question = "Which direction should we try?"; data.options = ["Minimal", "Expressive", "Balanced"].map((label, index) => ({ id: "choice-" + index, label, votes: (seed + index) % 5 })); }
  if (kind === "bookmark" && seed) { data.title = "Reference " + (seed + 1); data.url = "https://example.com/reference/" + seed; }
  return { kind, data, confidence: 1 } as AdaptiveIntent;
}
export default function AdaptiveDemos({ slug, appearance, thumbnail = false }: { slug: string; appearance: Appearance; thumbnail?: boolean }) {
  const kind = ADAPTIVE_STANDALONE_CARD_SPECS.find(card => card.slug === slug)?.kind ?? "event", combined = slug === "adaptive-input";
  const [intent, setIntent] = useState(() => sample(kind)), [text, setText] = useState(ADAPTIVE_EXAMPLES.event), [example, setExample] = useState<AdaptiveKind | "custom" | "saved">("event"), [referenceNow] = useState(() => new Date());
  const [seed, setSeed] = useState(0), [disabled, setDisabled] = useState(false), [editable, setEditable] = useState(true), [animate, setAnimate] = useState(true), [picker, setPicker] = useState(true), [asyncClassifier, setAsyncClassifier] = useState(false);
  const [feedback, setFeedback] = useState(""), [restore, setRestore] = useState<AdaptiveIntent | undefined>(), [saved, setSaved] = useState<{ id: number; text: string; intent: AdaptiveIntent }[]>([]);
  const savedId = useRef(0);
  function save(next: AdaptiveIntent) { const id = ++savedId.current; setSaved(previous => [{ id, text, intent: next }, ...previous].slice(0, 6)); setFeedback("Card added to this preview."); }
  function choose(next: AdaptiveKind | "custom" | "saved") { if (next === "custom" || next === "saved") return; setExample(next); setText(ADAPTIVE_EXAMPLES[next]); setRestore(undefined); setFeedback(""); setSeed(value => value + 1); }
  function randomize() { const next = seed + 1; setSeed(next); setFeedback(""); if (combined) { const nextKind = ADAPTIVE_KINDS[next % ADAPTIVE_KINDS.length]; setExample(nextKind); setText(ADAPTIVE_EXAMPLES[nextKind]); setRestore(undefined); } else setIntent(sample(kind, next)); }
  if (thumbnail) return <div className="adaptive-thumbnail">{combined ? <AdaptiveInput defaultValue="split 2400 between 3" currency="INR" showTypePicker={false} animateTransitions={false} appearance={appearance} /> : <AdaptiveCardRenderer intent={sample(kind)} onChange={() => {}} onSubmit={() => {}} appearance={appearance} />}</div>;
  return <section className="adaptive-demo artwork-customizer" data-appearance={appearance}>
    <div className="artwork-customizer-preview adaptive-demo-preview"><div className="adaptive-demo-art">{combined ? <AdaptiveInput key={seed} value={text} onValueChange={next => { setText(next); setRestore(undefined); setExample("custom"); setFeedback(""); }} onIntentChange={next => { if (example !== "custom" && example !== "saved" && next?.kind !== example) setExample("custom"); }} initialIntent={restore} now={referenceNow} currency="INR" onSave={save} classifier={asyncClassifier ? sampleClassifier : undefined} disabled={disabled} animateTransitions={animate} showTypePicker={picker} appearance={appearance} /> : <Standalone intent={intent} onChange={setIntent} onSubmit={() => setFeedback("Details ready to use.")} disabled={disabled} editable={editable} appearance={appearance} />}
      {combined && saved.length > 0 && <div className="adaptive-saved"><h3>Cards in this preview</h3><ul>{saved.map(card => <li key={card.id}><button type="button" className="adaptive-saved-edit" aria-label={"Edit saved " + ADAPTIVE_LABELS[card.intent.kind]} onClick={() => { setText(card.text); setRestore(card.intent); setExample("saved"); setFeedback(""); setSeed(value => value + 1); }}>{ADAPTIVE_LABELS[card.intent.kind]}<span>{card.text}</span></button><button type="button" aria-label={"Remove saved " + ADAPTIVE_LABELS[card.intent.kind]} onClick={() => setSaved(previous => previous.filter(entry => entry.id !== card.id))}>Remove</button></li>)}</ul></div>}
    </div><p className="adaptive-demo-caption" role="status">{feedback || (combined ? example === "custom" ? "Your input. Edit the interpreted fields before using the card." : example === "saved" ? "Restored saved request. Continue editing its card." : "Example text. Edit it or write your own request." : "Sample data. Edit the fields and try the actions.")}</p></div>
    <WorkbenchInspector><div className="adaptive-demo-controls artwork-customizer-settings"><Button appearance="polished" onClick={randomize}>Randomize {combined ? "example" : "sample"}</Button>
      {combined && <CustomizerSelect label="Load example" value={example} options={[{ value: "custom", label: "Custom input", disabled: true }, { value: "saved", label: "Saved request", disabled: true }, ...ADAPTIVE_KINDS.map(kind => ({ value: kind, label: ADAPTIVE_LABELS[kind] }))]} onChange={choose} />}
      <CustomizerToggle label="Disabled" checked={disabled} onChange={setDisabled} />
      {combined ? <><p className="adaptive-summary">Experimental input. The examples explore possible renderers; check the interpretation before using it.</p><CustomizerToggle label="Animate card changes" checked={animate} onChange={setAnimate} /><CustomizerToggle label="Show type picker" checked={picker} onChange={setPicker} /><CustomizerToggle label="Simulated async classifier" checked={asyncClassifier} onChange={setAsyncClassifier} /><p className="adaptive-summary">The default works offline. This optional demo classifier simulates latency and uses the same local parser.</p><p className="adaptive-summary">Saved cards remain in this preview session. Your app can store the emitted typed data.</p></> : <CustomizerToggle label="Editable fields" checked={editable} onChange={setEditable} />}
    </div></WorkbenchInspector>
  </section>;
}
function Standalone({ editable, ...props }: Parameters<typeof AdaptiveCardRenderer>[0] & { editable: boolean }) {
  return <AdaptiveCardRenderer {...props} editable={editable} />;
}

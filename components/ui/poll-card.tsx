"use client";
import { useState } from "react";
import { ChartNoAxesColumnIncreasing } from "lucide-react";
import { Button } from "./button";
import { CardField, CardFrame, useCardValue } from "./adaptive/card-ui";
import { ADAPTIVE_SAMPLE_DATA } from "./adaptive/samples";
import type { AdaptiveCardProps, PollData } from "./adaptive/types";
export type PollCardProps = AdaptiveCardProps<PollData> & { allowChangeVote?: boolean };
export function PollCard(props: PollCardProps) {
  const [value, setValue] = useCardValue(props, ADAPTIVE_SAMPLE_DATA.poll), [newChoice, setNewChoice] = useState("");
  const { disabled, editable = true, appearance = "polished", className, allowChangeVote = true } = props;
  const total = value.options.reduce((sum, option) => sum + Math.max(0, option.votes), 0);
  function vote(id: string) { if (disabled || !allowChangeVote && value.selection) return; const next = value.selection === id ? undefined : id; const updated = { ...value, selection: next, options: value.options.map(option => ({ ...option, votes: Math.max(0, option.votes + (option.id === next ? 1 : 0) - (option.id === value.selection ? 1 : 0)) })) }; setValue(updated); props.onSubmit?.(updated); }
  return <CardFrame title="Poll" kind="poll" icon={<ChartNoAxesColumnIncreasing aria-hidden="true" />} appearance={appearance} className={className} disabled={disabled}>
    <CardField label="Question" value={value.question} disabled={disabled} readOnly={!editable} onChange={event => setValue({ ...value, question: event.target.value })} />
    <div className="adaptive-poll-options">{value.options.map((option, index) => <button key={option.id + "-" + index} type="button" className="adaptive-poll-choice" aria-pressed={value.selection === option.id} disabled={disabled || Boolean(!allowChangeVote && value.selection)} onClick={() => vote(option.id)}><span>{option.label}</span><span>{option.votes} {option.votes === 1 ? "vote" : "votes"}</span></button>)}</div>
    <p className="adaptive-summary" role="status">{total} total votes{value.selection ? ". Your choice is selected." : ". Choose an option."}</p>
    {!value.options.length && <p className="adaptive-summary">Add choices to start a poll.</p>}
    {editable && <details className="adaptive-details"><summary>Edit choices</summary>{value.options.map((option, index) => <div className="adaptive-choice-edit" key={option.id + "-" + index}><CardField label={"Choice " + (index + 1)} value={option.label} disabled={disabled} onChange={event => setValue({ ...value, options: value.options.map((entry, i) => i === index ? { ...entry, label: event.target.value } : entry) })} /><Button appearance={appearance} variant="ghost" disabled={disabled} onClick={() => setValue({ ...value, selection: value.selection === option.id ? undefined : value.selection, options: value.options.filter((_, i) => i !== index) })}>Remove</Button></div>)}<div className="adaptive-add-row"><CardField label="New choice" value={newChoice} disabled={disabled} onChange={event => setNewChoice(event.target.value)} /><Button appearance={appearance} variant="secondary" disabled={disabled || !newChoice.trim()} onClick={() => { setValue({ ...value, options: [...value.options, { id: "choice-" + Date.now() + "-" + value.options.length, label: newChoice.trim(), votes: 0 }] }); setNewChoice(""); }}>Add</Button></div></details>}
  </CardFrame>;
}

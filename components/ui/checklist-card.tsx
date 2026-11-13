"use client";
import { useId, useState } from "react";
import { ListChecks, Plus, X } from "lucide-react";
import { Button } from "./button";
import { CardField, CardFrame, CardSubmit, useCardValue } from "./adaptive/card-ui";
import { ADAPTIVE_SAMPLE_DATA } from "./adaptive/samples";
import type { AdaptiveCardProps, ChecklistData } from "./adaptive/types";
export type ChecklistCardProps = AdaptiveCardProps<ChecklistData>;
export function ChecklistCard(props: ChecklistCardProps) {
  const [value, setValue] = useCardValue(props, ADAPTIVE_SAMPLE_DATA.checklist), [draft, setDraft] = useState(""), id = useId();
  const { disabled, editable = true, appearance = "polished", className } = props;
  function add() { if (!draft.trim() || disabled || !editable) return; setValue({ ...value, items: [...value.items, { id: id + "-" + Date.now() + "-" + value.items.length, text: draft.trim(), checked: false }] }); setDraft(""); }
  return <CardFrame title="Checklist" kind="checklist" icon={<ListChecks aria-hidden="true" />} appearance={appearance} className={className} disabled={disabled}>
    <CardField label="List title" value={value.title} disabled={disabled} readOnly={!editable} onChange={event => setValue({ ...value, title: event.target.value })} />
    <p className="adaptive-summary">{value.items.filter(item => item.checked).length} of {value.items.length} completed</p>
    <ul className="adaptive-list">{value.items.map((item, index) => <li key={item.id + "-" + index} data-checked={item.checked}><label className="adaptive-check"><input type="checkbox" checked={item.checked} disabled={disabled || !editable} aria-label={"Complete " + (item.text || "item " + (index + 1))} onChange={event => setValue({ ...value, items: value.items.map((entry, i) => i === index ? { ...entry, checked: event.target.checked } : entry) })} /></label><input className="adaptive-inline-input" aria-label={"Item " + (index + 1)} value={item.text} disabled={disabled} readOnly={!editable} onChange={event => setValue({ ...value, items: value.items.map((entry, i) => i === index ? { ...entry, text: event.target.value } : entry) })} />{editable && <button type="button" className="adaptive-icon-button" aria-label={"Remove item " + (index + 1)} disabled={disabled} onClick={() => setValue({ ...value, items: value.items.filter((_, i) => i !== index) })}><X aria-hidden="true" /></button>}</li>)}</ul>
    {!value.items.length && <p className="adaptive-summary">Add an item to start this list.</p>}
    {editable && <div className="adaptive-add-row"><CardField label="New item" placeholder="Add to the list" value={draft} disabled={disabled} onChange={event => setDraft(event.target.value)} onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); add(); } }} /><Button appearance={appearance} variant="secondary" disabled={disabled || !draft.trim()} onClick={add} aria-label="Add item"><Plus aria-hidden="true" /></Button></div>}
    <CardSubmit hidden={props.showSubmit === false} label="Use checklist" value={value} onSubmit={props.onSubmit} appearance={appearance} disabled={disabled || !value.items.length} />
  </CardFrame>;
}

"use client";
import { StickyNote } from "lucide-react";
import { CardField, CardFrame, CardSubmit, CardText, useCardValue } from "./adaptive/card-ui";
import { ADAPTIVE_SAMPLE_DATA } from "./adaptive/samples";
import type { AdaptiveCardProps, NoteData } from "./adaptive/types";
export type NoteCardProps = AdaptiveCardProps<NoteData>;
export function NoteCard(props: NoteCardProps) {
  const [value, setValue] = useCardValue(props, ADAPTIVE_SAMPLE_DATA.note), { disabled, editable = true, appearance = "polished", className } = props;
  return <CardFrame title="Note" kind="note" icon={<StickyNote aria-hidden="true" />} appearance={appearance} className={className} disabled={disabled}>
    <CardField label="Note title" value={value.title} disabled={disabled} readOnly={!editable} onChange={event => setValue({ ...value, title: event.target.value })} />
    <CardText label="Note text" rows={6} value={value.text} disabled={disabled} readOnly={!editable} onChange={event => setValue({ ...value, text: event.target.value })} />
    <CardSubmit hidden={props.showSubmit === false} label="Use note" value={value} onSubmit={props.onSubmit} appearance={appearance} disabled={disabled || !value.text.trim()} />
  </CardFrame>;
}

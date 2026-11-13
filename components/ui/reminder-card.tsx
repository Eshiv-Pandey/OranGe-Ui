"use client";
import { Bell } from "lucide-react";
import { CardField, CardFrame, CardSelect, CardSubmit, useCardValue } from "./adaptive/card-ui";
import { ADAPTIVE_SAMPLE_DATA } from "./adaptive/samples";
import type { AdaptiveCardProps, ReminderData } from "./adaptive/types";
export type ReminderCardProps = AdaptiveCardProps<ReminderData>;
export function ReminderCard(props: ReminderCardProps) {
  const [value, setValue] = useCardValue(props, ADAPTIVE_SAMPLE_DATA.reminder), { disabled, editable = true, appearance = "polished", className } = props;
  const patch = (next: Partial<ReminderData>) => setValue({ ...value, ...next });
  return <CardFrame title="Reminder" kind="reminder" icon={<Bell aria-hidden="true" />} appearance={appearance} className={className} disabled={disabled}>
    <CardField label="Task" value={value.title} onChange={event => patch({ title: event.target.value })} disabled={disabled} readOnly={!editable} />
    <CardField label="Due time" type="datetime-local" value={value.due} onChange={event => patch({ due: event.target.value })} disabled={disabled} readOnly={!editable} />
    <CardSelect label="Priority" value={value.priority} onChange={event => patch({ priority: event.target.value as ReminderData["priority"] })} disabled={disabled || !editable}><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option></CardSelect>
    <label className="adaptive-check"><input type="checkbox" checked={value.completed} disabled={disabled || !editable} onChange={event => patch({ completed: event.target.checked })} /><span>Completed</span></label>
    <CardSubmit hidden={props.showSubmit === false} label="Use reminder" value={value} onSubmit={props.onSubmit} appearance={appearance} disabled={disabled || !value.title.trim()} />
  </CardFrame>;
}

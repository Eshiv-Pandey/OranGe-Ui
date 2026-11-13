"use client";
import { CalendarDays } from "lucide-react";
import { CardField, CardFrame, CardSubmit, useCardValue } from "./adaptive/card-ui";
import { ADAPTIVE_SAMPLE_DATA } from "./adaptive/samples";
import type { AdaptiveCardProps, EventData } from "./adaptive/types";
export type EventCardProps = AdaptiveCardProps<EventData>;
export function EventCard(props: EventCardProps) {
  const [value, setValue] = useCardValue(props, ADAPTIVE_SAMPLE_DATA.event), { disabled, editable = true, appearance = "polished", className } = props;
  const patch = (next: Partial<EventData>) => setValue({ ...value, ...next });
  return <CardFrame title="Event" kind="event" icon={<CalendarDays aria-hidden="true" />} appearance={appearance} className={className} disabled={disabled}>
    <CardField label="Event title" value={value.title} onChange={event => patch({ title: event.target.value })} disabled={disabled} readOnly={!editable} />
    <div className="adaptive-field-pair"><CardField label="Date" type="date" value={value.date} onChange={event => patch({ date: event.target.value })} disabled={disabled} readOnly={!editable} /><CardField label="Time" type="time" value={value.time} onChange={event => patch({ time: event.target.value })} disabled={disabled} readOnly={!editable} /></div>
    <CardField label="Location" value={value.location} placeholder="Add a place or meeting link" onChange={event => patch({ location: event.target.value })} disabled={disabled} readOnly={!editable} />
    <CardField label="Attendees" value={value.attendees.join(", ")} placeholder="Names separated by commas" onChange={event => patch({ attendees: event.target.value.split(",").map(name => name.trim()) })} disabled={disabled} readOnly={!editable} />
    <CardSubmit hidden={props.showSubmit === false} label="Use event" value={value} onSubmit={props.onSubmit} appearance={appearance} disabled={disabled || !value.title.trim() || !value.date || !value.time} />
  </CardFrame>;
}

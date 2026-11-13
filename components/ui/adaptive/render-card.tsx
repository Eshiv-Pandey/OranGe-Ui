"use client";
import type { ReactNode } from "react";
import { EventCard } from "../event-card";
import { ReminderCard } from "../reminder-card";
import { ChecklistCard } from "../checklist-card";
import { FocusTimerCard } from "../focus-timer-card";
import { ColorCard } from "../color-card";
import { BillSplitCard } from "../bill-split-card";
import { UnitConverterCard } from "../unit-converter-card";
import { CalculatorCard } from "../calculator-card";
import { PollCard } from "../poll-card";
import { BookmarkCard } from "../bookmark-card";
import { NoteCard } from "../note-card";
import type { Appearance } from "../appearance";
import type { AdaptiveDataMap, AdaptiveIntent, AdaptiveKind, AdaptiveRenderers } from "./types";
export function AdaptiveCardRenderer({ intent, onChange, onSubmit, appearance = "polished", disabled = false, editable = true, showSubmit = true, renderers }: { intent: AdaptiveIntent; onChange: (intent: AdaptiveIntent) => void; onSubmit: (intent: AdaptiveIntent) => void; appearance?: Appearance; disabled?: boolean; editable?: boolean; showSubmit?: boolean; renderers?: AdaptiveRenderers }) {
  function bindings<K extends AdaptiveKind>(kind: K, data: AdaptiveDataMap[K]) { return { value: data, appearance, disabled, editable, showSubmit, onChange: (next: AdaptiveDataMap[K]) => onChange({ ...intent, kind, data: next } as AdaptiveIntent), onSubmit: (next: AdaptiveDataMap[K]) => onSubmit({ ...intent, kind, data: next } as AdaptiveIntent) }; }
  function render<K extends AdaptiveKind>(kind: K, data: AdaptiveDataMap[K], fallback: ReactNode) { const renderer = renderers?.[kind]; return renderer ? renderer(bindings(kind, data)) : fallback; }
  switch (intent.kind) {
    case "event": return render("event", intent.data, <EventCard {...bindings("event", intent.data)} />);
    case "reminder": return render("reminder", intent.data, <ReminderCard {...bindings("reminder", intent.data)} />);
    case "checklist": return render("checklist", intent.data, <ChecklistCard {...bindings("checklist", intent.data)} />);
    case "timer": return render("timer", intent.data, <FocusTimerCard {...bindings("timer", intent.data)} />);
    case "color": return render("color", intent.data, <ColorCard {...bindings("color", intent.data)} />);
    case "split": return render("split", intent.data, <BillSplitCard {...bindings("split", intent.data)} />);
    case "convert": return render("convert", intent.data, <UnitConverterCard {...bindings("convert", intent.data)} />);
    case "calculate": return render("calculate", intent.data, <CalculatorCard {...bindings("calculate", intent.data)} />);
    case "poll": return render("poll", intent.data, <PollCard {...bindings("poll", intent.data)} />);
    case "bookmark": return render("bookmark", intent.data, <BookmarkCard {...bindings("bookmark", intent.data)} />);
    case "note": return render("note", intent.data, <NoteCard {...bindings("note", intent.data)} />);
  }
}

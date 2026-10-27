"use client";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { uiClass, type AppearanceProps } from "./appearance";
import "../../styles/library-components.css";
export type CommandItem = { value: string; label: string; description?: string; keywords?: string[]; disabled?: boolean };
export type CommandProps = AppearanceProps & { label?: string; placeholder?: string; items: CommandItem[]; onSelect?: (value: string) => void; emptyMessage?: string };
export function Command({ appearance = "polished", className, label = "Search commands", placeholder = "Type a command...", items, onSelect, emptyMessage = "No results found." }: CommandProps) {
  const id = useId(); const [query, setQuery] = useState(""); const [active, setActive] = useState(0); const [selected, setSelected] = useState("");
  const inputRef = useRef<HTMLInputElement>(null); const activeRef = useRef<HTMLButtonElement>(null);
  const filtered = items.filter((item) => [item.label, item.description, ...(item.keywords ?? [])].join(" ").toLowerCase().includes(query.trim().toLowerCase()));
  const enabled = filtered.filter((item) => !item.disabled);
  const current = enabled[Math.min(active, Math.max(0, enabled.length - 1))];
  const currentId = current ? id + "-option-" + filtered.indexOf(current) : undefined;
  useEffect(() => {
    const input = inputRef.current;
    if (input && input.ownerDocument.activeElement === input) activeRef.current?.scrollIntoView?.({ block: "nearest" });
  }, [current]);
  function select(value: string) { setSelected(items.find((item) => item.value === value)?.label ?? ""); onSelect?.(value); }
  function keyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      if (event.key === "Home") setActive(0);
      else if (event.key === "End") setActive(Math.max(0, enabled.length - 1));
      else setActive((index) => enabled.length ? (index + (event.key === "ArrowDown" ? 1 : -1) + enabled.length) % enabled.length : 0);
    } else if (event.key === "Enter" && current) { event.preventDefault(); select(current.value); }
    else if (event.key === "Escape") { setQuery(""); setActive(0); setSelected(""); }
  }
  return <div className={uiClass("ui-command ui-surface", className)} data-appearance={appearance}>
    <label className="sr-only" htmlFor={id}>{label}</label><div className="ui-command-search"><span aria-hidden="true">⌕</span><input ref={inputRef} id={id} role="combobox" aria-autocomplete="list" aria-expanded="true" aria-controls={id + "-list"} aria-activedescendant={currentId} value={query} placeholder={placeholder} onChange={(event) => { setQuery(event.target.value); setActive(0); setSelected(""); }} onKeyDown={keyDown} autoComplete="off" /></div>
    <div role="listbox" id={id + "-list"} aria-label="Results" className="ui-command-list">
      {filtered.map((item, index) => <button ref={current === item ? activeRef : undefined} type="button" role="option" tabIndex={-1} key={item.value} id={id + "-option-" + index} aria-selected={current?.value === item.value} disabled={item.disabled} onMouseDown={(event) => event.preventDefault()} onClick={() => { setActive(enabled.indexOf(item)); select(item.value); }} className="ui-command-item"><span>{item.label}{item.description && <small>{item.description}</small>}</span><span aria-hidden="true">↵</span></button>)}
      {!filtered.length && <p className="ui-command-empty">{emptyMessage}</p>}
    </div>
    <p className="ui-command-status" role="status">{selected ? selected + " selected" : filtered.length + " results. Use arrow keys and Enter."}</p>
  </div>;
}

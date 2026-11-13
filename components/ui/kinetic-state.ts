"use client";

import { useState } from "react";

/** A removed or invalid selection falls back immediately without changing controlled state. */
export function useKineticValue(values: readonly string[], value: string | undefined, defaultValue: string | undefined, onValueChange?: (value: string) => void) {
  const [local, setLocal] = useState(defaultValue ?? values[0]);
  const candidate = value ?? local;
  const selected = candidate !== undefined && values.includes(candidate) ? candidate : values[0];
  function choose(next: string) {
    if (!values.includes(next) || next === selected) return;
    if (value === undefined) setLocal(next);
    onValueChange?.(next);
  }
  return [selected, choose] as const;
}

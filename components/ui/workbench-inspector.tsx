"use client";

import { createContext, useContext, type ReactNode } from "react";
import { createPortal } from "react-dom";

const Inspector = createContext<HTMLElement | null>(null);
export const WorkbenchInspectorProvider = Inspector.Provider;

/** A docs host can place controls in its inspector. Standalone editors stay inline. */
export function WorkbenchInspector({ children }: { children: ReactNode }) {
  const target = useContext(Inspector);
  return target ? createPortal(children, target) : children;
}

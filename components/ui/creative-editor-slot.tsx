"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

const EditorTarget = createContext<HTMLElement | null>(null);

/** Optional layout host. Components still render their editors inline when used alone. */
export function CreativeWorkbench({ preview, children }: { preview: ReactNode; children?: ReactNode }) {
  const [target, setTarget] = useState<HTMLDivElement | null>(null);
  return <EditorTarget.Provider value={target}>
    <div className="creative-workbench">
      <div className="creative-demo-preview" data-main-preview="">{preview}</div>
      <aside className="creative-inspector" aria-label="Component properties">
        <header className="creative-inspector-heading"><h3>Properties</h3><span>Live preview</span></header>
        <div className="creative-inspector-scroll">
          {children && <div className="creative-controls">{children}</div>}
          <div ref={setTarget} />
        </div>
      </aside>
    </div>
  </EditorTarget.Provider>;
}

/** Place secondary editing tools beside the preview when a workbench is present. */
export function CreativeEditorSlot({ children }: { children: ReactNode }) {
  const target = useContext(EditorTarget);
  return target ? createPortal(<div className="creative-inspector-section">{children}</div>, target) : <>{children}</>;
}

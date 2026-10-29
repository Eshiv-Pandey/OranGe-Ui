"use client";

import { useEffect, useId, useRef, useState } from "react";

export type CodeBlockCopyProps = { code: string; label?: string };

export function CodeBlockCopy({ code, label = "Copy code" }: CodeBlockCopyProps) {
  const id = useId();
  const field = useRef<HTMLTextAreaElement>(null);
  const [result, setResult] = useState<{ code: string; status: "copying" | "copied" | "failed" } | null>(null);
  const status = result?.code === code ? result.status : "idle";
  useEffect(() => {
    if (status === "failed") { field.current?.focus(); field.current?.select(); }
  }, [status, code]);
  async function copy() {
    if (status === "copying") return;
    setResult({ code, status: "copying" });
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(code);
      setResult({ code, status: "copied" });
    } catch { setResult({ code, status: "failed" }); }
  }
  return <div className="ui-code-copy">
    <button className="ui-code-copy-button" type="button" disabled={status === "copying"} onClick={copy}>{status === "copying" ? "Copying..." : status === "copied" ? "Copied" : label}</button>
    <span className="sr-only" role="status" aria-live="polite">{status === "copied" ? "Code copied." : ""}</span>
    {status === "failed" && <div className="ui-code-copy-fallback"><p role="status">Clipboard unavailable. Select and copy the code below.</p><label className="sr-only" htmlFor={id}>Code to copy</label><textarea ref={field} id={id} readOnly value={code} rows={5} spellCheck={false} onFocus={(event) => event.currentTarget.select()} /></div>}
  </div>;
}

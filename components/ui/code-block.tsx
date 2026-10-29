import { useId, type CSSProperties } from "react";
import { uiClass, type AppearanceProps } from "./appearance";
import { CodeBlockCopy } from "./code-block-copy";
import "../../styles/launch-navigation.css";

export type CodeBlockProps = AppearanceProps & {
  code: string;
  language?: string;
  filename?: string;
  label?: string;
  showLineNumbers?: boolean;
  wrap?: boolean;
  copy?: boolean;
  maxHeight?: number | string;
};

/** Static escaped code stays server-renderable; only the copy control is a client leaf. */
export function CodeBlock({ code, language, filename, label = "Source code", showLineNumbers = false, wrap = false, copy = true, maxHeight = 420, appearance = "polished", className }: CodeBlockProps) {
  const id = useId();
  return <figure className={uiClass("ui-code-block ui-surface", className)} data-appearance={appearance} data-wrap={wrap}>
    <figcaption className="ui-code-header"><span id={id} className="ui-code-title" title={filename}>{filename ?? language ?? label}</span>{copy && <CodeBlockCopy code={code} />}</figcaption>
    <pre className="ui-code-source" tabIndex={0} role="region" aria-label={label} aria-describedby={id} style={{ maxHeight } as CSSProperties}><code data-language={language}>{showLineNumbers ? code.split(/\r?\n/).map((line, index) => <span className="ui-code-line" key={index}><span className="ui-code-line-number" aria-hidden="true">{index + 1}</span><span>{line || "\u200b"}</span></span>) : code}</code></pre>
  </figure>;
}

export type AIGlyphName = "send" | "stop" | "attach" | "close" | "chevron" | "check" | "error" | "tool" | "clock" | "pause";

export function AIGlyph({ name, className }: { name: AIGlyphName; className?: string }) {
  return <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    {name === "send" && <path d="M12 19V5M5 12L12 5L19 12" />}
    {name === "stop" && <rect x="6" y="6" width="12" height="12" rx="1" fill="currentColor" stroke="none" />}
    {name === "attach" && <path d="M8 13L14 7A3 3 0 0 1 18 11L10 19A5 5 0 0 1 3 12L12 3M6 15L14 7" />}
    {name === "close" && <path d="M6 6L18 18M18 6L6 18" />}
    {name === "chevron" && <path d="M6 9L12 15L18 9" />}
    {name === "check" && <path d="M5 12L10 17L19 7" />}
    {name === "error" && <><circle cx="12" cy="12" r="9" /><path d="M12 7V12M12 16H12.01" /></>}
    {name === "tool" && <path d="M14 4A6 6 0 0 0 7 11L3 15A3 3 0 0 0 7 19L11 15A6 6 0 0 0 18 8L15 11L12 8L15 5Z" />}
    {name === "clock" && <><circle cx="12" cy="12" r="9" /><path d="M12 6V12L16 14" /></>}
    {name === "pause" && <path d="M8 5V19M16 5V19" />}
  </svg>;
}

export type Appearance = "polished" | "pixel";
export type AppearanceProps = { appearance?: Appearance; className?: string };
export function uiClass(name: string, className?: string) {
  return ["ui", name, className].filter(Boolean).join(" ");
}

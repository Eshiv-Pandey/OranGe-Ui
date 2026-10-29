import { ImageResponse } from "next/og";
import { components } from "../lib/components";

export const alt = "oRangeUi: React components with a pixel soul and five distinct appearances.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(<div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: "100%", height: "100%", padding: "64px 72px", background: "#fafafa", color: "#171717" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 20 }}><svg width="72" height="72" viewBox="0 0 24 24"><path fill="#ff6a00" stroke="#171717" strokeWidth="1" d="M7 5h10v2h3v3h2v9h-3v3H5v-3H2v-9h2V7h3Z"/><path fill="#5c7c36" d="M12 1h8v3h-5v3h-3Z"/><path fill="#171717" d="M7 11h3v3H7zm8 0h3v3h-3zm-5 6h5v2h-5z"/></svg><span style={{ fontSize: 48, fontWeight: 700 }}>oRangeUi.</span></div>
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}><span style={{ fontSize: 76, lineHeight: 1.05, letterSpacing: -3, maxWidth: 960 }}>A pixel soul.<br />A polished finish.</span><span style={{ fontSize: 29, color: "#555555" }}>{components.length} React components. Five ways to make them yours.</span></div>
    <div style={{ display: "flex", gap: 16, alignItems: "center", fontSize: 23 }}><span style={{ background: "#ff6a00", padding: "12px 20px", borderRadius: 10 }}>Polished</span><span style={{ padding: "12px 10px" }}>Pixelated</span><span style={{ padding: "12px 10px" }}>Neobrutalism</span><span style={{ padding: "12px 10px" }}>Retro OS</span><span style={{ padding: "12px 10px" }}>Terminal</span></div>
  </div>, size);
}

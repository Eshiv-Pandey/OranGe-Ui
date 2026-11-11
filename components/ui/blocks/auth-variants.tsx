"use client";
import { useRef, useState } from "react";
import { ArrowUpRight, Flower2, Sparkles, Sun } from "lucide-react";
import { AuthForm, type AuthMode, type AuthPanelProps } from "./auth";
import { BlockBrand, BlockFrame, BlockPhoto } from "./shared";
import "../../../styles/auth-blocks.css";

export type AuthLayoutProps = AuthPanelProps;
type Layout = "quiet" | "studio" | "contrast" | "playful";
const copy: Record<Layout, { title: string; signup: string; description: string }> = {
  quiet: { title: "Welcome to your space.", signup: "A fresh beginning.", description: "One small step. Everything you need to begin." },
  studio: { title: "Start something good.", signup: "Your next chapter starts here.", description: "A thoughtful place for ideas, people and the work ahead." },
  contrast: { title: "Find your flow.", signup: "Make it your own.", description: "Sign in to pick up where you left off." },
  playful: { title: "Come on in.", signup: "Good to meet you.", description: "A name, an email, and a little possibility." },
};
function AuthLayout({ layout, brand = "Daylight", initialMode = "sign-in", mode, onModeChange, imageSrc, imageAlt, ...props }: AuthLayoutProps & { layout: Layout }) {
  const [local, setLocal] = useState<AuthMode>(initialMode);
  const focusAfterSwitchRef = useRef(false);
  const active = mode ?? local;
  function choose(next: AuthMode) { focusAfterSwitchRef.current = true; setLocal(next); onModeChange?.(next); }
  const entry = active === "sign-in" || active === "sign-up";
  return <BlockFrame appearance={props.appearance} id={props.id} className={`ob-auth-layout ob-auth-${layout} ${props.className ?? ""}`}>
    {layout === "quiet" && <div className="ob-quiet-mark" aria-hidden="true"><Sun size={42} strokeWidth={1.3} /></div>}
    {layout === "studio" && <div className="ob-studio-art"><BlockBrand name={brand} /><h2>Small starts.<br />Open doors.</h2><p>Make a little room for the things you want to create.</p><div className="ob-studio-photos"><BlockPhoto photo="coast" src={imageSrc} alt={imageAlt} /><BlockPhoto photo="flowers" /></div><span>Come as you are.<ArrowUpRight size={18} aria-hidden="true" /></span></div>}
    {layout === "contrast" && <div className="ob-contrast-art"><BlockPhoto photo="forest" src={imageSrc} alt={imageAlt} /><div className="ob-contrast-tint" /><div className="ob-contrast-art-copy"><Flower2 size={46} strokeWidth={1.4} aria-hidden="true" /><h2>A different<br />kind of bright.</h2><p>Ideas grow when you give them a place.</p></div></div>}
    {layout === "playful" && <div className="ob-playful-art"><BlockBrand name={brand} /><div className="ob-playful-sticker" aria-hidden="true"><Sparkles size={27} /></div><h2>Good ideas<br />start together.</h2><p>No big setup. Just your next small step.</p><div className="ob-playful-sun" aria-hidden="true"><Sun size={92} strokeWidth={1.5} /></div></div>}
    <div className="ob-auth-layout-main"><AuthForm key={active} {...props} brand={brand} active={active} choose={choose} focusAfterSwitchRef={focusAfterSwitchRef} headline={entry ? active === "sign-up" ? copy[layout].signup : copy[layout].title : undefined} introduction={entry ? copy[layout].description : undefined} /></div>
  </BlockFrame>;
}
export function QuietAuth(props: AuthLayoutProps) { return <AuthLayout {...props} layout="quiet" />; }
export function StudioAuth(props: AuthLayoutProps) { return <AuthLayout {...props} layout="studio" />; }
export function ContrastAuth(props: AuthLayoutProps) { return <AuthLayout {...props} layout="contrast" />; }
export function PlayfulAuth(props: AuthLayoutProps) { return <AuthLayout initialMode="sign-up" {...props} layout="playful" />; }

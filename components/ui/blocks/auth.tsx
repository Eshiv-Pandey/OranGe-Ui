"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, Eye, EyeOff, KeyRound, Mail, ShieldCheck } from "lucide-react";
import { Button } from "../button";
import { Input } from "../input";
import { BlockBrand, BlockFeedback, BlockFrame, BlockPhoto, useBlockSubmission, type BlockProps } from "./shared";

export type AuthMode = "sign-in" | "sign-up" | "recover" | "verify";
export type AuthSubmission = { mode: AuthMode; email: string; password?: string; name?: string; code?: string };
export type AuthPanelProps = BlockProps & {
  brand?: string; initialMode?: AuthMode; mode?: AuthMode; onModeChange?: (mode: AuthMode) => void;
  onSubmit?: (values: AuthSubmission) => void | Promise<void>;
  providers?: { id: string; label: string }[]; onProvider?: (id: string) => void | Promise<void>;
  imageSrc?: string; imageAlt?: string; successMessage?: string; termsHref?: string;
};

const headings: Record<AuthMode, { title: string; description: string; action: string }> = {
  "sign-in": { title: "Good to have you back.", description: "A little space for everything you're working on.", action: "Sign in" },
  "sign-up": { title: "Make room for good work.", description: "Start with a name, an email, and your next idea.", action: "Create account" },
  recover: { title: "Let's get you back in.", description: "Enter your email to request a password reset link.", action: "Send reset link" },
  verify: { title: "One small check.", description: "Enter the six-digit code from your email.", action: "Verify code" },
};

export function AuthPanel({ brand = "Daylight", initialMode = "sign-in", mode, onModeChange, imageSrc, imageAlt, ...props }: AuthPanelProps) {
  const [localMode, setLocalMode] = useState<AuthMode>(initialMode);
  const focusAfterSwitchRef = useRef(false);
  const active = mode ?? localMode;
  function choose(next: AuthMode) { focusAfterSwitchRef.current = true; setLocalMode(next); onModeChange?.(next); }
  return <BlockFrame appearance={props.appearance} id={props.id} className={`ob-auth ${props.className ?? ""}`}>
    <div className="ob-auth-art"><BlockPhoto photo="forest" src={imageSrc} alt={imageAlt} /><div className="ob-auth-art-copy"><BlockBrand name={brand} /><h2>A little room<br />for your next idea.</h2><p>Less noise. More possibility.</p></div></div>
    <div className="ob-auth-main"><AuthForm key={active} {...props} active={active} choose={choose} brand={brand} focusAfterSwitchRef={focusAfterSwitchRef} /></div>
  </BlockFrame>;
}

export function AuthForm({ active, choose, brand, onSubmit, providers = [], onProvider, successMessage = "Your request is complete.", termsHref, appearance = "polished", headline, introduction, focusAfterSwitchRef }: AuthPanelProps & { active: AuthMode; choose: (mode: AuthMode) => void; headline?: string; introduction?: string; focusAfterSwitchRef?: { current: boolean } }) {
  const [visible, setVisible] = useState(false), [errors, setErrors] = useState<Record<string, string>>({});
  const submission = useBlockSubmission(), formId = useId(), copy = headings[active];
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => { if (focusAfterSwitchRef?.current) { focusAfterSwitchRef.current = false; formRef.current?.querySelector<HTMLInputElement>("input")?.focus(); } }, [focusAfterSwitchRef]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submission.pending) return;
    const data = new FormData(event.currentTarget), email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? ""), name = String(data.get("name") ?? "").trim(), code = String(data.get("code") ?? "").replace(/ /g, "");
    const next: Record<string, string> = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "Enter a valid email address.";
    if (active === "sign-up" && !name) next.name = "Enter your name.";
    if (active === "sign-in" && !password) next.password = "Enter your password.";
    if (active === "sign-up" && password.length < 8) next.password = "Use at least 8 characters.";
    if (active === "verify" && !/^\d{6}$/.test(code)) next.code = "Enter the six-digit code.";
    setErrors(next);
    if (Object.keys(next).length || !onSubmit) return;
    await submission.run(() => onSubmit({ mode: active, email, ...(active === "sign-in" || active === "sign-up" ? { password } : {}), ...(active === "sign-up" ? { name } : {}), ...(active === "verify" ? { code } : {}) }));
  }
  return <div className="ob-auth-form-wrap">
    <BlockBrand name={brand} />
    {(active === "recover" || active === "verify") && <button className="ob-text-button" onClick={() => choose("sign-in")} type="button"><ArrowLeft size={15} />Back to sign in</button>}
    <div className="ob-auth-heading"><span className="ob-auth-symbol" aria-hidden="true">{active === "verify" ? <ShieldCheck /> : active === "recover" ? <Mail /> : <KeyRound />}</span><h1>{headline ?? copy.title}</h1><p>{introduction ?? copy.description}</p></div>
    {(active === "sign-in" || active === "sign-up") && <div className="ob-segment" role="group" aria-label="Account action">{(["sign-in", "sign-up"] as const).map(item => <button type="button" key={item} aria-pressed={active === item} onClick={() => choose(item)}>{item === "sign-in" ? "Sign in" : "Create account"}</button>)}</div>}
    <form ref={formRef} id={formId} noValidate onSubmit={submit} className="ob-form">
      {active === "sign-up" && <Input appearance={appearance} name="name" label="Your name" autoComplete="name" placeholder="Alex Morgan" error={errors.name} disabled={submission.pending} required />}
      <Input appearance={appearance} name="email" label="Email address" type="email" autoComplete="email" placeholder="you@example.com" error={errors.email} disabled={submission.pending} required />
      {(active === "sign-in" || active === "sign-up") && <div className="ob-password"><Input appearance={appearance} name="password" label="Password" type={visible ? "text" : "password"} autoComplete={active === "sign-up" ? "new-password" : "current-password"} description={active === "sign-up" ? "At least 8 characters." : undefined} error={errors.password} disabled={submission.pending} required /><button type="button" className="ob-password-eye" aria-label={visible ? "Hide password" : "Show password"} aria-pressed={visible} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>}
      {active === "verify" && <Input appearance={appearance} name="code" label="Verification code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="000000" className="ob-code-field" error={errors.code} disabled={submission.pending} required />}
      {active === "sign-in" && <button type="button" className="ob-text-button ob-recover" onClick={() => choose("recover")}>Forgot password?</button>}
      <Button appearance={appearance} type="submit" loading={submission.pending} disabled={!onSubmit} className="ob-full-button">{copy.action}</Button>
      <BlockFeedback {...submission} success={successMessage} />
    </form>
    {providers.length > 0 && (active === "sign-in" || active === "sign-up") && <div className="ob-provider-group"><span>or continue with</span>{providers.map(provider => <Button key={provider.id} variant="secondary" disabled={!onProvider || submission.pending} onClick={() => submission.run(() => onProvider!(provider.id))}>{provider.label}</Button>)}</div>}
    {termsHref && <p className="ob-small">By continuing, you agree to our <a href={termsHref}>terms of service</a>.</p>}
  </div>;
}

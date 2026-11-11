"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowUpRight, Sun } from "lucide-react";
import { Button } from "../button";
import { KEEPSAKE_PHOTOS } from "../keepsake-photos";
import "../../../styles/blocks.css";

export type BlockProps = { appearance?: "polished"; className?: string; id?: string };
export type BlockAction = { label: string; href: string };
export type BlockLink = { label: string; href: string };
export type SubmissionState = "idle" | "pending" | "success" | "error";

export function BlockFrame({ children, className = "", appearance = "polished", id }: BlockProps & { children: ReactNode }) {
  return <div className="ob-container"><section id={id} className={`orange-block ${className}`} data-appearance={appearance}>{children}</section></div>;
}

export function BlockBrand({ name = "Daylight", href }: { name?: string; href?: string }) {
  const content = <><Sun size={23} strokeWidth={1.7} aria-hidden="true" /><span>{name}</span></>;
  return href ? <a className="ob-brand" href={href}>{content}</a> : <span className="ob-brand">{content}</span>;
}

export function BlockTitle({ title, description }: { title: string; description?: string }) {
  return <div className="ob-heading"><h2>{title}</h2>{description && <p>{description}</p>}</div>;
}

export function BlockActionLink({ action, secondary = false }: { action: BlockAction; secondary?: boolean }) {
  return <Button asChild variant={secondary ? "secondary" : "primary"}><a href={action.href}>{action.label}<ArrowUpRight size={17} aria-hidden="true" /></a></Button>;
}

/* Downloaded sections use regular React images and remain framework independent. */
export function BlockPhoto({ photo = "forest", src, alt, className = "" }: { photo?: string; src?: string; alt?: string; className?: string }) {
  const sample = KEEPSAKE_PHOTOS.find(item => item.id === photo) ?? KEEPSAKE_PHOTOS[0];
  // eslint-disable-next-line @next/next/no-img-element
  return <img className={`ob-photo ${className}`} src={src ?? sample.src} alt={alt ?? sample.alt} loading="lazy" decoding="async" />;
}

export function useBlockSubmission() {
  const [state, setState] = useState<SubmissionState>("idle");
  const [error, setError] = useState("");
  const sequence = useRef(0), pending = useRef(false);
  useEffect(() => () => { sequence.current++; }, []);
  const reset = useCallback(() => { sequence.current++; pending.current = false; setState("idle"); setError(""); }, []);
  const run = useCallback(async (action: () => void | Promise<void>) => {
    if (pending.current) return false;
    pending.current = true;
    const token = ++sequence.current;
    setError(""); setState("pending");
    try {
      await action();
      if (sequence.current === token) { setState("success"); return true; }
    } catch (caught) {
      if (sequence.current === token) { setState("error"); setError(caught instanceof Error ? caught.message : "Something went wrong. Please try again."); }
    } finally { if (sequence.current === token) pending.current = false; }
    return false;
  }, []);
  return { state, error, run, reset, pending: state === "pending" };
}

export function BlockFeedback({ state, error, success = "Your changes are saved." }: { state: SubmissionState; error?: string; success?: string }) {
  return <div className="ob-feedback" aria-live="polite">{state === "success" && <p className="ob-success" role="status">{success}</p>}{state === "error" && <p className="ob-error" role="alert">{error}</p>}</div>;
}

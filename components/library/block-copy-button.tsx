"use client";

import { useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Check, Copy } from "lucide-react";
import "../../styles/block-copy-button.css";

type BlockCopyButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick" | "children"> & {
  onCopy: () => Promise<boolean>;
  label: string;
  icon?: ReactNode;
  iconOnly?: boolean;
};

export function BlockCopyButton({ onCopy, label, icon = <Copy size={15} aria-hidden="true" />, iconOnly = false, className = "", disabled, ...props }: BlockCopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const [pending, setPending] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; clearTimeout(timer.current); };
  }, []);

  async function copy() {
    clearTimeout(timer.current);
    setPending(true);
    setCopied(false);
    try {
      const success = await onCopy();
      if (!mounted.current) return;
      setCopied(success);
      if (success) timer.current = setTimeout(() => setCopied(false), 2200);
    } finally {
      if (mounted.current) setPending(false);
    }
  }

  return <button {...props} type="button" className={`block-copy-button ${className}`} disabled={disabled || pending} aria-busy={pending || undefined} data-copied={copied} onClick={copy}>
    <span className="block-copy-icon" key={copied ? "copied" : "idle"}>{copied ? <Check size={16} aria-hidden="true" /> : icon}</span>
    {!iconOnly && <span>{copied ? "Copied" : label}</span>}
    <span className="sr-only" role="status">{copied ? `${label} copied to clipboard.` : ""}</span>
  </button>;
}

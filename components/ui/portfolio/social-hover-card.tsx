"use client";
import { useState, type ReactNode } from "react";
import { HoverCard } from "radix-ui";
import { motion, AnimatePresence } from "framer-motion";
import { useReducedMotion } from "./use-reduced-motion";
import "../../../styles/portfolio.css";
export interface SocialProfile {
  name: string; handle: string; avatar?: string; bio: string; location?: string;
  accent?: string; stats?: readonly { label: string; value: string }[];
  platform?: string; badge?: string;
}
export default function SocialHoverCard({ profile, children, theme }: { profile?: SocialProfile; children: ReactNode; theme: "light" | "dark" }) {
  const [open, setOpen] = useState(false), reduced = useReducedMotion();
  if (!profile) return <>{children}</>;
  return <HoverCard.Root open={open} onOpenChange={setOpen} openDelay={80} closeDelay={120}>
    <HoverCard.Trigger asChild onFocus={() => setOpen(true)} onBlur={() => setOpen(false)}>{children}</HoverCard.Trigger>
    <AnimatePresence>{open && <HoverCard.Portal forceMount><HoverCard.Content asChild forceMount side="bottom" align="center" sideOffset={8} collisionPadding={12}>
      <motion.div className="portfolio-scope portfolio-hover-card" data-theme={theme} initial={reduced ? false : { opacity: 0, y: 4, scale: .985 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={reduced ? { opacity: 0 } : { opacity: 0, y: 3, scale: .985 }} transition={{ duration: reduced ? 0 : .22, ease: [.16, 1, .3, 1] }}>
        <div className="portfolio-hover-accent" style={{ backgroundColor: profile.accent ?? "var(--portfolio-desi-teal)" }}><span aria-hidden="true" className="portfolio-hover-cover-mark" />{profile.platform && <span className="portfolio-hover-platform">{profile.platform}</span>}</div>
        <div className="portfolio-hover-body"><div className="portfolio-hover-identity">
          <div className="portfolio-hover-avatar">
            {profile.avatar ? <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={profile.avatar} alt={profile.name} width={48} height={48} loading="eager" decoding="async" />
            </> : <span aria-hidden="true">{profile.name.trim().split(/\s+/).slice(0, 2).map(word => word[0]).join("").toUpperCase()}</span>}
          </div>
          <div className="portfolio-hover-name"><h3>{profile.name}</h3><span>{profile.handle}</span></div>{profile.badge && <span className="portfolio-hover-badge">{profile.badge}</span>}
        </div><p className="portfolio-hover-bio">{profile.bio}</p>
          {profile.location && <div className="portfolio-hover-location"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg><span>{profile.location}</span></div>}
          {!!profile.stats?.length && <div className="portfolio-hover-stats">{profile.stats.map(stat => <div key={stat.label}><strong>{stat.value}</strong><span>{stat.label}</span></div>)}</div>}
        </div>
      </motion.div>
    </HoverCard.Content></HoverCard.Portal>}</AnimatePresence>
  </HoverCard.Root>;
}

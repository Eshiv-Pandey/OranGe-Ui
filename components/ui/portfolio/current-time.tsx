"use client";
import { useEffect, useState } from "react";
export function CurrentTime({ timeZone }: { timeZone?: string }) {
  const [time, setTime] = useState<Date | null>(null);
  useEffect(() => { const initial = window.setTimeout(() => setTime(new Date()), 0); const timer = window.setInterval(() => { if (!document.hidden) setTime(new Date()); }, 1000); return () => { clearTimeout(initial); clearInterval(timer); }; }, []);
  const parts = time ? new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23", timeZone }).format(time).split(":") : ["00", "00", "00"];
  return <div className="portfolio-clock" style={{ opacity: time ? 1 : 0 }} aria-label={time ? `Current time ${parts.join(":")}` : undefined}>{parts.map((part,index) => <span key={index} style={{ display: "contents" }}>{index > 0 && <span className="portfolio-clock-dots" aria-hidden="true"><i /><i /></span>}<span>{part}</span></span>)}</div>;
}

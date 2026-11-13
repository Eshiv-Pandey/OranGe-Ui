"use client";

import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { BlockFrame, type BlockProps } from "./shared";
import { SectionArt } from "./section-visuals";
import { customerStories } from "./testimonial-data";
import "../../../styles/team-variants.css";

export type TeamMember = { name: string; role: string; bio: string; imageSrc?: string };
const sampleMembers: TeamMember[] = [
  { name: "Avery Lane", role: "Design director", bio: "Finds the clear idea inside the complicated one.", imageSrc: customerStories[0].imageSrc },
  { name: "Jamie Reed", role: "Creative developer", bio: "Brings a little curiosity to every moving part.", imageSrc: customerStories[1].imageSrc },
  { name: "Riley Morgan", role: "Project lead", bio: "Makes room for good people and thoughtful work.", imageSrc: customerStories[2].imageSrc },
  { name: "Morgan Ellis", role: "Brand strategist", bio: "Connects the small details to the bigger story.", imageSrc: customerStories[3].imageSrc },
  { name: "Alex Quinn", role: "Product designer", bio: "Asks useful questions and makes useful things.", imageSrc: customerStories[0].imageSrc },
  { name: "Rowan Park", role: "Community lead", bio: "Helps different voices find a shared way forward.", imageSrc: customerStories[1].imageSrc },
];
export type TeamBlockProps = BlockProps & { title?: string; description?: string; members?: TeamMember[] };
function MemberPhoto({ member }: { member: TeamMember }) {
  // eslint-disable-next-line @next/next/no-img-element -- Portable illustrative photographs carry their source notice.
  return member.imageSrc ? <img src={member.imageSrc} alt="" width={400} height={500} loading="lazy" decoding="async" /> : <span className="ot-initials" aria-hidden="true">{member.name.split(" ").map(word => word[0]).slice(0, 2).join("")}</span>;
}
function TeamHeading({ title, description }: { title: string; description: string }) { return <header><h2>{title}</h2><p>{description}</p></header>; }
export function CollageTeam({ title = "Good people.\nBetter together.", description = "Different perspectives. A shared way to make things.", members = sampleMembers, ...props }: TeamBlockProps) {
  return <BlockFrame {...props} className={`sb-section ot-collage ${props.className ?? ""}`}><TeamHeading title={title} description={description} /><div className="ot-collage-grid">{members.length ? members.map((member, index) => <article key={`${member.name}-${index}`}><div className="ot-collage-photo"><MemberPhoto member={member} /></div><div><h3>{member.name}</h3><strong>{member.role}</strong><p>{member.bio}</p></div></article>) : <p className="ot-empty">No team members to show yet.</p>}</div><footer>Good work begins with good company.<ArrowUpRight aria-hidden="true" /></footer></BlockFrame>;
}

function FlipMember({ member }: { member: TeamMember }) {
  const [open, setOpen] = useState(false);
  return <button type="button" className="ot-flip-card" data-open={open} aria-pressed={open} aria-label={`${member.name}, ${member.role}. ${open ? "Show portrait" : "Show role"}.`} onClick={() => setOpen(value => !value)}><span className="ot-flip-inner"><span className="ot-flip-front" aria-hidden="true"><MemberPhoto member={member} /><strong>{member.name}</strong><ArrowUpRight size={16} /></span><span className="ot-flip-back" aria-hidden="true"><span>{member.name}</span><strong>{member.role}</strong><span>{member.bio}</span></span></span></button>;
}
const teamArt = ["sprout", "fold", "pebble", "eye", "spark", "sun"] as const;
export function FlipTeam({ title = "The people\nbehind the ideas.", description = "Hover, focus or tap a portrait to meet the role behind it.", members = sampleMembers, ...props }: TeamBlockProps) {
  return <BlockFrame {...props} className={`sb-section ot-flip ${props.className ?? ""}`}><TeamHeading title={title} description={description} /><div className="ot-flip-grid">{members.length ? members.flatMap((member, index) => [<FlipMember key={`member-${index}`} member={member} />, <div key={`art-${index}`} className="ot-flip-art" aria-hidden="true"><SectionArt kind={teamArt[index % teamArt.length]} /></div>]) : <p className="ot-empty">No team members to show yet.</p>}</div><footer>A little curiosity. A good team.</footer></BlockFrame>;
}

export function CharacterTeam({ title = "Every team\nhas its characters.", description = "Original illustrated profiles for people with a little personality.", members = sampleMembers.slice(0, 3), ...props }: TeamBlockProps) {
  return <BlockFrame {...props} className={`sb-section ot-characters ${props.className ?? ""}`}><TeamHeading title={title} description={description} /><div className="ot-character-grid">{members.length ? members.map((member, index) => <article className="ot-character-card" data-color={index % 3} key={`${member.name}-${index}`}><div className="ot-character-art" aria-hidden="true"><i /><SectionArt kind={teamArt[index % teamArt.length]} /></div><h3>{member.name}</h3><strong>{member.role}</strong><details><summary>A little more<ArrowUpRight size={16} aria-hidden="true" /></summary><p>{member.bio}</p></details></article>) : <p className="ot-empty">No team members to show yet.</p>}</div></BlockFrame>;
}

export function PosterTeam({ title = "GOOD PEOPLE.\nGREAT COMPANY.", description = "The minds, hands and hearts making things happen.", members = sampleMembers.slice(0, 3), ...props }: TeamBlockProps) {
  return <BlockFrame {...props} className={`sb-section ot-poster ${props.className ?? ""}`}><TeamHeading title={title} description={description} /><div className="ot-poster-grid">{members.length ? members.map((member, index) => <article data-color={index % 3} key={`${member.name}-${index}`}><div className="ot-poster-photo"><MemberPhoto member={member} /></div><div><h3>{member.name}</h3><strong>{member.role}</strong><p>{member.bio}</p></div></article>) : <p className="ot-empty">No team members to show yet.</p>}</div></BlockFrame>;
}

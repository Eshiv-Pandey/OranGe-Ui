import type { SocialProfile } from "./social-hover-card";
import type { StickerProfile } from "../sticker-social-icons";
import { FaLinkedinIn } from "react-icons/fa6";
import { SiGithub, SiLeetcode, SiMedium, SiX } from "react-icons/si";

export const PORTFOLIO_HOVER_PROFILES: Record<string, SocialProfile> = Object.fromEntries(
  ["GitHub", "LinkedIn", "Medium", "LeetCode", "X"].map(name => [name, {
    name: "Sample profile", handle: "@example", bio: "Making thoughtful things for the web.",
    location: "Your city, Anywhere", accent: "var(--portfolio-desi-teal)",
  }]),
);
export const PORTFOLIO_SOCIALS: StickerProfile[] = [
  { name: "GitHub", href: "https://example.com/github", Icon: SiGithub, appearance: "github" },
  { name: "LinkedIn", href: "https://example.com/linkedin", Icon: FaLinkedinIn, appearance: "linkedin" },
  { name: "Medium", href: "https://example.com/medium", Icon: SiMedium, appearance: "medium" },
  { name: "LeetCode", href: "https://example.com/leetcode", Icon: SiLeetcode, appearance: "leetcode" },
  { name: "X", href: "https://example.com/x", Icon: SiX, appearance: "x" },
].map(profile => ({ ...profile, hoverCard: PORTFOLIO_HOVER_PROFILES[profile.name] }));

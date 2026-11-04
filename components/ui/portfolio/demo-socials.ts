import type { SocialProfile } from "./social-hover-card";
import type { StickerProfile } from "../sticker-social-icons";
const AVATAR = "https://avatars.githubusercontent.com/u/194340770?v=4";

export const PORTFOLIO_HOVER_PROFILES: Record<string, SocialProfile> = {
  GitHub: {
    name: "Eshiv Pandey",
    handle: "Eshiv-Pandey",
    avatar: AVATAR,
    bio: "Full stack · DevOps · AI/ML. CNCF HAMi member.",
    location: "New Delhi, India (UTC +05:30)",
    accent: "var(--portfolio-desi-marigold)",
    stats: [
      { value: "35", label: "Repositories" },
      { value: "805", label: "Contributions" },
    ],
  },
  LeetCode: {
    name: "Eshiv Pandey",
    handle: "Eshiv_Pandey",
    avatar: AVATAR,
    bio: "Daily DSA. Mostly mediums, working up the hards.",
    location: "New Delhi, India (UTC +05:30)",
    accent: "var(--portfolio-desi-teal)",
    stats: [
      { value: "207", label: "Solved" },
      { value: "48", label: "Day streak" },
    ],
  },
  LinkedIn: {
    name: "Eshiv Pandey",
    handle: "in/eshiv-pandey18",
    avatar: AVATAR,
    bio: "B.Tech ECE @ University of Delhi, minor in AI & ML. Open to internships and new grad roles.",
    location: "New Delhi, India",
    accent: "var(--portfolio-desi-indigo)",
    stats: [],
  },
  Medium: {
    name: "Eshiv Pandey",
    handle: "@eshivpandey",
    avatar: AVATAR,
    bio: "Notes on open source, systems, and getting started with contributing.",
    location: "New Delhi, India (UTC +05:30)",
    accent: "var(--portfolio-desi-rose)",
    stats: [],
  },
  X: {
    name: "Eshiv Pandey",
    handle: "@Eshiv_Pandey",
    avatar: AVATAR,
    bio: "Find me on X.",
    location: "New Delhi, India",
    accent: "var(--portfolio-desi-teal)",
    stats: [],
  },
};

import { FaLinkedinIn } from "react-icons/fa6";
import { SiGithub, SiLeetcode, SiMedium, SiX } from "react-icons/si";
import type { IconType } from "react-icons";

export interface SocialLink {
  name: string;
  href: string;
  Icon: IconType;
  appearance: string;
}

export const PORTFOLIO_SOCIALS: StickerProfile[] = [
  { name: "GitHub", href: "https://github.com/Eshiv-Pandey", Icon: SiGithub, hoverCard: PORTFOLIO_HOVER_PROFILES.GitHub, appearance: "github" },
  { name: "LinkedIn", href: "https://www.linkedin.com/in/eshiv-pandey18/", Icon: FaLinkedinIn, hoverCard: PORTFOLIO_HOVER_PROFILES.LinkedIn, appearance: "linkedin" },
  { name: "Medium", href: "https://medium.com/@eshivpandey", Icon: SiMedium, hoverCard: PORTFOLIO_HOVER_PROFILES.Medium, appearance: "medium" },
  { name: "LeetCode", href: "https://leetcode.com/u/Eshiv_Pandey/", Icon: SiLeetcode, hoverCard: PORTFOLIO_HOVER_PROFILES.LeetCode, appearance: "leetcode" },
  { name: "X", href: "https://x.com/Eshiv_Pandey", Icon: SiX, hoverCard: PORTFOLIO_HOVER_PROFILES.X, appearance: "x" },
];

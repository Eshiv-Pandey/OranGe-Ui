import { FaLinkedinIn } from "react-icons/fa6";
import { SiBehance, SiBluesky, SiDevdotto, SiDiscord, SiDribbble, SiFacebook, SiGithub, SiHashnode, SiInstagram, SiLeetcode, SiMastodon, SiMedium, SiPatreon, SiPinterest, SiReddit, SiSpotify, SiStackoverflow, SiSubstack, SiTelegram, SiThreads, SiTwitch, SiWhatsapp, SiX, SiYoutube } from "react-icons/si";
import type { StickerProfile } from "../sticker-social-icons";

/** Brand marks and authored sticker palettes. Supply your own destination URLs. */
export const SOCIAL_STICKER_PRESETS = [
  { name: "GitHub", Icon: SiGithub, appearance: "github" },
  { name: "LinkedIn", Icon: FaLinkedinIn, appearance: "linkedin" },
  { name: "Medium", Icon: SiMedium, appearance: "medium" },
  { name: "LeetCode", Icon: SiLeetcode, appearance: "leetcode" },
  { name: "X", Icon: SiX, appearance: "x" },
  { name: "Instagram", Icon: SiInstagram, appearance: "instagram" },
  { name: "Discord", Icon: SiDiscord, appearance: "discord" },
  { name: "YouTube", Icon: SiYoutube, appearance: "youtube" },
  { name: "Reddit", Icon: SiReddit, appearance: "reddit" },
  { name: "Dribbble", Icon: SiDribbble, appearance: "dribbble" },
  { name: "Behance", Icon: SiBehance, appearance: "behance" },
  { name: "Twitch", Icon: SiTwitch, appearance: "twitch" },
  { name: "Bluesky", Icon: SiBluesky, appearance: "bluesky" },
  { name: "Telegram", Icon: SiTelegram, appearance: "telegram" },
  { name: "Pinterest", Icon: SiPinterest, appearance: "pinterest" },
  { name: "Substack", Icon: SiSubstack, appearance: "substack" },
  { name: "Spotify", Icon: SiSpotify, appearance: "spotify" },
  { name: "Threads", Icon: SiThreads, appearance: "threads" },
  { name: "WhatsApp", Icon: SiWhatsapp, appearance: "whatsapp" },
  { name: "Mastodon", Icon: SiMastodon, appearance: "mastodon" },
  { name: "Facebook", Icon: SiFacebook, appearance: "facebook" },
  { name: "Stack Overflow", Icon: SiStackoverflow, appearance: "stackoverflow" },
  { name: "DEV", Icon: SiDevdotto, appearance: "dev" },
  { name: "Hashnode", Icon: SiHashnode, appearance: "hashnode" },
  { name: "Patreon", Icon: SiPatreon, appearance: "patreon" },
] as const satisfies readonly Pick<StickerProfile, "name" | "Icon" | "appearance">[];

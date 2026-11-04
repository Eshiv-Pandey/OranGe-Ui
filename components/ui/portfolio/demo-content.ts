import type { PortfolioFooterLinkGroup } from "../portfolio-footer";
export { PORTFOLIO_SOCIALS, PORTFOLIO_HOVER_PROFILES } from "./demo-socials";
export const PORTFOLIO_BRAND = "Eshiv Pandey";
export const PORTFOLIO_CONTACT = { email: "eshivpandey18@gmail.com", phone: "+91 82796 28207", phoneHref: "tel:+918279628207", location: "New Delhi, India" };
export const PORTFOLIO_LINK_GROUPS: PortfolioFooterLinkGroup[] = [
  { title: "Quick Links", links: [{ name: "Home", href: "https://eshiv.in/" }, { name: "Projects", href: "https://eshiv.in/projects" }, { name: "Experience", href: "https://eshiv.in/experience" }, { name: "Pull Requests", href: "https://eshiv.in/pull-requests" }, { name: "Contact", href: "https://eshiv.in/contact" }] },
  { title: "On This Page", links: ["Experience", "Projects", "Activity", "Open Source", "Skills", "Writing", "Highlights"].map((name, index) => ({ name, href: `https://eshiv.in/#${["experience", "projects", "activity", "opensource", "skills", "writing", "highlights"][index]}` })) },
  { title: "Open Source", links: [{ name: "Project-HAMi / HAMi", href: "https://github.com/Project-HAMi/HAMi", external: true }, { name: "HAMi-core", href: "https://github.com/Project-HAMi/HAMi-core", external: true }, { name: "sugarlabs / musicblocks", href: "https://github.com/sugarlabs/musicblocks", external: true }, { name: "All pull requests", href: "https://eshiv.in/pull-requests" }] },
];

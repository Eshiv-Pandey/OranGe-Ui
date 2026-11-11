import type { PortfolioFooterLinkGroup } from "../portfolio-footer";
export { PORTFOLIO_SOCIALS, PORTFOLIO_HOVER_PROFILES } from "./demo-socials";
export const PORTFOLIO_BRAND = "Sample Studio";
export const PORTFOLIO_CONTACT = { email: "hello@example.com", phone: "+1 (555) 010-2020", phoneHref: "tel:+15550102020", location: "Your city, Anywhere" };
export const PORTFOLIO_LINK_GROUPS: PortfolioFooterLinkGroup[] = [
  { title: "Explore", links: ["Home", "Projects", "About", "Contact"].map(name => ({ name, href: `https://example.com/${name.toLowerCase()}` })) },
  { title: "Resources", links: ["Articles", "Guides", "Downloads", "Support"].map(name => ({ name, href: `https://example.com/${name.toLowerCase()}` })) },
  { title: "Community", links: ["Open Source", "Events", "Newsletter", "Contribute"].map(name => ({ name, href: `https://example.com/${name.toLowerCase().replace(/ /g, "-")}` })) },
];

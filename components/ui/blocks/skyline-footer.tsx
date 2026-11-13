"use client";

import { PortfolioFooter, type PortfolioFooterProps } from "../portfolio-footer";
import { PORTFOLIO_CONTACT, PORTFOLIO_SOCIALS } from "../portfolio/demo-content";
import "../../../styles/skyline-footer.css";

export type SkylineFooterProps = Omit<PortfolioFooterProps, "brand" | "linkGroups"> & {
  brand?: PortfolioFooterProps["brand"];
  linkGroups?: PortfolioFooterProps["linkGroups"];
};

const links = [{ title: "Quick links", links: [
  { name: "Projects", href: "https://example.com/projects" },
  { name: "About", href: "https://example.com/about" },
  { name: "Journal", href: "https://example.com/journal" },
  { name: "Contact", href: "mailto:hello@example.com" },
] }];

/** A compact portfolio close with the original monument band and working truck. */
export function SkylineFooter({
  brand = "Sample Studio", linkGroups = links, contact = PORTFOLIO_CONTACT,
  profiles = PORTFOLIO_SOCIALS, className, ...props
}: SkylineFooterProps) {
  return <PortfolioFooter {...props} brand={brand} linkGroups={linkGroups}
    contact={contact} profiles={profiles}
    className={["skyline-footer", className].filter(Boolean).join(" ")} />;
}

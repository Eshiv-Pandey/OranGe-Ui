import type { ComponentPropsWithoutRef } from "react";
import { uiClass, type AppearanceProps } from "./appearance";
import "../../styles/library-components.css";
export type BreadcrumbProps = ComponentPropsWithoutRef<"nav"> & AppearanceProps & { items: { label: string; href?: string }[] };
export function Breadcrumb({ appearance = "polished", className, items, "aria-label": label = "Breadcrumb", ...props }: BreadcrumbProps) {
  return <nav {...props} aria-label={label} className={uiClass("ui-breadcrumb", className)} data-appearance={appearance}><ol>{items.map((item, index) => <li key={index}>
    {index > 0 && <span aria-hidden="true" className="ui-breadcrumb-divider">/</span>}
    {item.href && index < items.length - 1 ? <a href={item.href}>{item.label}</a> : <span aria-current={index === items.length - 1 ? "page" : undefined}>{item.label}</span>}
  </li>)}</ol></nav>;
}

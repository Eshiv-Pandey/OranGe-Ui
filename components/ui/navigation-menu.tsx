"use client";

import { NavigationMenu as Primitive } from "radix-ui";
import type { ComponentPropsWithoutRef } from "react";
import { uiClass, type AppearanceProps } from "./appearance";
import { ChevronIcon } from "./symbols";
import { navigationLinkElement, type NavigationLink, type NavigationLinkContext, type NavigationSection } from "./navigation-shared";
import "../../styles/launch-navigation.css";

export type NavigationMenuItem = NavigationLink | { value: string; label: string; links: readonly NavigationLink[]; disabled?: boolean };
export type NavigationMenuProps = Omit<ComponentPropsWithoutRef<typeof Primitive.Root>, "children"> & AppearanceProps & Omit<NavigationLinkContext, "collapsed"> & {
  items: readonly NavigationMenuItem[];
  label?: string;
};

export function navigationMenuSections(items: readonly NavigationMenuItem[]): NavigationSection[] {
  return items.map((item) => "links" in item ? { value: item.value, label: item.label, links: item.disabled ? item.links.map((link) => ({ ...link, disabled: true })) : item.links } : { value: item.value, links: [item] });
}

export function NavigationMenu({ items, label = "Main navigation", appearance = "polished", className, activeValue, renderLink, onNavigate, ...props }: NavigationMenuProps) {
  return <Primitive.Root {...props} aria-label={label} className={uiClass("ui-navigation-menu", className)} data-appearance={appearance}>
    <Primitive.List className="ui-navigation-list">{items.map((item) => <Primitive.Item key={item.value} value={item.value} className="ui-navigation-item">
      {"links" in item ? <>
        <Primitive.Trigger className="ui-navigation-trigger" disabled={item.disabled} data-active={item.links.some((link) => link.active ?? link.value === activeValue) || undefined}>{item.label}<ChevronIcon /></Primitive.Trigger>
        <Primitive.Content className="ui-navigation-content ui-surface">
          <ul className="ui-navigation-content-list">{item.links.map((link) => <li key={link.value}>{link.disabled ? navigationLinkElement(link, { activeValue }) : <Primitive.Link asChild active={link.active ?? link.value === activeValue}>{navigationLinkElement(link, { activeValue, renderLink, onNavigate })}</Primitive.Link>}</li>)}</ul>
        </Primitive.Content>
      </> : item.disabled ? navigationLinkElement(item, { activeValue }) : <Primitive.Link asChild active={item.active ?? item.value === activeValue}>{navigationLinkElement(item, { activeValue, renderLink, onNavigate })}</Primitive.Link>}
    </Primitive.Item>)}</Primitive.List>
  </Primitive.Root>;
}

export type { NavigationLink, NavigationLinkRenderer } from "./navigation-shared";

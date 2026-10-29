"use client";

import type { ReactNode } from "react";
import { uiClass, type AppearanceProps } from "./appearance";
import { Button } from "./button";
import { Sheet } from "./sheet";
import { NavigationMenu, navigationMenuSections, type NavigationMenuItem } from "./navigation-menu";
import { NavigationGlyph, NavigationLinkSections, useCloseOnDesktop, useControllableValue, type NavigationLinkContext } from "./navigation-shared";
import "../../styles/launch-navigation.css";

export type NavbarProps = AppearanceProps & Omit<NavigationLinkContext, "className" | "collapsed"> & {
  brand: ReactNode;
  items: readonly NavigationMenuItem[];
  actions?: ReactNode;
  label?: string;
  mobileOpen?: boolean;
  defaultMobileOpen?: boolean;
  onMobileOpenChange?: (open: boolean) => void;
};

export function Navbar({ brand, items, actions, label = "Main navigation", mobileOpen, defaultMobileOpen = false, onMobileOpenChange, activeValue, renderLink, onNavigate, appearance = "polished", className }: NavbarProps) {
  const [open, setOpen] = useControllableValue(mobileOpen, defaultMobileOpen, onMobileOpenChange);
  useCloseOnDesktop(() => setOpen(false));
  return <header className={uiClass("ui-navbar", className)} data-appearance={appearance}>
    <div className="ui-navbar-brand">{brand}</div>
    <div className="ui-navbar-desktop"><NavigationMenu items={items} label={label} activeValue={activeValue} renderLink={renderLink} onNavigate={onNavigate} appearance={appearance} /></div>
    {actions && <div className="ui-navbar-actions">{actions}</div>}
    <div className="ui-navbar-mobile"><Sheet open={open} onOpenChange={setOpen} appearance={appearance} title={label} side="right" className="ui-navbar-sheet" footer={actions ? <div className="ui-navbar-mobile-actions">{actions}</div> : undefined} trigger={<Button appearance={appearance} variant="secondary" aria-label={`Open ${label.toLowerCase()}`}><NavigationGlyph kind="menu" /></Button>}>
      <nav aria-label={`${label} mobile`}><NavigationLinkSections sections={navigationMenuSections(items)} activeValue={activeValue} renderLink={renderLink} onNavigate={(link) => { setOpen(false); onNavigate?.(link); }} /></nav>
    </Sheet></div>
  </header>;
}

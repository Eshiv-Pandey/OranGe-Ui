"use client";

import type { ReactNode } from "react";
import { uiClass, type AppearanceProps } from "./appearance";
import { Button } from "./button";
import { Sheet } from "./sheet";
import { NavigationGlyph, NavigationLinkSections, useCloseOnDesktop, useControllableValue, type NavigationLinkContext, type NavigationSection } from "./navigation-shared";
import "../../styles/launch-navigation.css";

export type SidebarProps = AppearanceProps & Omit<NavigationLinkContext, "className" | "collapsed"> & {
  sections: readonly NavigationSection[];
  label?: string;
  header?: ReactNode;
  footer?: ReactNode;
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  mobileOpen?: boolean;
  defaultMobileOpen?: boolean;
  onMobileOpenChange?: (open: boolean) => void;
};

export function Sidebar({ sections, label = "Workspace navigation", header, footer, collapsed, defaultCollapsed = false, onCollapsedChange, mobileOpen, defaultMobileOpen = false, onMobileOpenChange, activeValue, renderLink, onNavigate, appearance = "polished", className }: SidebarProps) {
  const [compact, setCompact] = useControllableValue(collapsed, defaultCollapsed, onCollapsedChange);
  const [open, setOpen] = useControllableValue(mobileOpen, defaultMobileOpen, onMobileOpenChange);
  useCloseOnDesktop(() => setOpen(false));
  return <div className={uiClass("ui-sidebar", className)} data-appearance={appearance} data-collapsed={compact}>
    <aside className="ui-sidebar-desktop" aria-label={label}>
      <div className="ui-sidebar-heading">{header && !compact && <div className="ui-sidebar-brand">{header}</div>}<button type="button" className="ui-icon-button ui-sidebar-collapse" aria-label={compact ? "Expand sidebar" : "Collapse sidebar"} aria-expanded={!compact} onClick={() => setCompact(!compact)}><NavigationGlyph kind={compact ? "expand" : "collapse"} /></button></div>
      <nav aria-label={label} className="ui-sidebar-navigation"><NavigationLinkSections sections={sections} collapsed={compact} activeValue={activeValue} renderLink={renderLink} onNavigate={onNavigate} /></nav>
      {footer && !compact && <div className="ui-sidebar-footer">{footer}</div>}
    </aside>
    <div className="ui-sidebar-mobile"><Sheet open={open} onOpenChange={setOpen} appearance={appearance} title={label} side="left" className="ui-sidebar-sheet" trigger={<Button appearance={appearance} variant="secondary"><NavigationGlyph kind="menu" /><span>Navigation</span></Button>}>
      {header && <div className="ui-sidebar-mobile-brand">{header}</div>}
      <nav aria-label={`${label} mobile`}><NavigationLinkSections sections={sections} activeValue={activeValue} renderLink={renderLink} onNavigate={(link) => { setOpen(false); onNavigate?.(link); }} /></nav>
      {footer && <div className="ui-sidebar-footer">{footer}</div>}
    </Sheet></div>
    <span className="sr-only" role="status">{compact ? "Sidebar collapsed" : "Sidebar expanded"}</span>
  </div>;
}

export type { NavigationSection } from "./navigation-shared";

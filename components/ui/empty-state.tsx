import type { ReactNode } from "react";
import { uiClass, type AppearanceProps } from "./appearance";
import "../../styles/library-components.css";
export type EmptyStateProps = AppearanceProps & { title: string; description: string; icon?: ReactNode; action?: ReactNode };
export function EmptyState({ appearance = "polished", className, title, description, icon, action }: EmptyStateProps) {
  return <section className={uiClass("ui-empty-state ui-surface", className)} data-appearance={appearance}>
    <div className="ui-empty-symbol" aria-hidden="true">{icon ?? <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 9h10l3 4h11v14H4z" /><path d="M16 17v6m-3-3h6" /></svg>}</div>
    <h3>{title}</h3><p className="ui-help">{description}</p>{action && <div className="ui-empty-action">{action}</div>}
  </section>;
}

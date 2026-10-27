import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { uiClass, type AppearanceProps } from "./appearance";
import "../../styles/library-components.css";
export type CardProps = Omit<ComponentPropsWithoutRef<"article">, "title"> & AppearanceProps & { title: string; description?: string; eyebrow?: string; footer?: ReactNode; heading?: "h2" | "h3" | "h4" };
export function Card({ appearance = "polished", className, title, description, eyebrow, footer, children, heading: Heading = "h3", ...props }: CardProps) {
  return <article {...props} className={uiClass("ui-card ui-surface", className)} data-appearance={appearance}>
    <header>{eyebrow && <p className="ui-card-eyebrow">{eyebrow}</p>}<Heading className="ui-card-title">{title}</Heading>{description && <p className="ui-help">{description}</p>}</header>
    {children && <div className="ui-card-body">{children}</div>}{footer && <footer className="ui-card-footer">{footer}</footer>}
  </article>;
}

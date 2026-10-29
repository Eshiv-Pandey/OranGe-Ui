import { Children, cloneElement, isValidElement, useId, type ComponentPropsWithoutRef, type ReactNode } from "react";
import ReactMarkdown, { defaultUrlTransform, type Components, type ExtraProps } from "react-markdown";
import remarkGfm from "remark-gfm";
import { uiClass, type AppearanceProps } from "./appearance";
import { CodeBlock } from "./code-block";
import "../../styles/launch-ai.css";

export type MarkdownProps = AppearanceProps & {
  content: string;
  openLinksInNewTab?: boolean;
  /** Optional application-owned renderers, such as a router link adapter. */
  components?: Components;
};

type TaskChildProps = ExtraProps & { type?: string; children?: ReactNode; "aria-labelledby"?: string; "aria-label"?: string };

function markdownTag(child: ReactNode) {
  return isValidElement<TaskChildProps>(child) ? typeof child.type === "string" ? child.type : child.props.node?.tagName : undefined;
}

function labelTaskChildren(children: ReactNode, labelId: string): ReactNode {
  const items = Children.toArray(children);
  const checkboxIndex = items.findIndex((child) => isValidElement<TaskChildProps>(child) && child.props.type === "checkbox");
  const checkbox = items[checkboxIndex];
  if (isValidElement<TaskChildProps>(checkbox)) {
    const nestedListIndex = items.findIndex((child, index) => index > checkboxIndex && ["ul", "ol"].includes(markdownTag(child) ?? ""));
    const labelEnd = nestedListIndex < 0 ? items.length : nestedListIndex;
    const label = items.slice(checkboxIndex + 1, labelEnd);
    const hasLabel = label.some((child) => typeof child !== "string" || child.trim().length > 0);
    return <>{items.slice(0, checkboxIndex)}{cloneElement(checkbox, hasLabel ? { "aria-labelledby": labelId } : { "aria-label": "Task" })}<span id={labelId}>{label}</span>{items.slice(labelEnd)}</>;
  }
  return items.map((child) => markdownTag(child) === "p" && isValidElement<TaskChildProps>(child) ? cloneElement(child, {}, labelTaskChildren(child.props.children, labelId)) : child);
}

function MarkdownListItem({ node, children, ...props }: ComponentPropsWithoutRef<"li"> & ExtraProps) {
  const id = useId();
  void node;
  return <li {...props}>{props.className?.split(/\s+/).includes("task-list-item") ? labelTaskChildren(children, `${id}-task-label`) : children}</li>;
}

/** GFM with raw HTML omitted, safe URLs and separately scrollable code and tables. */
export function Markdown({ content, openLinksInNewTab = false, components, appearance = "polished", className }: MarkdownProps) {
  const id = useId();
  const renderers: Components = {
    li: MarkdownListItem,
    pre({ children }) {
      if (!isValidElement<{ children?: ReactNode; className?: string }>(children)) return <pre>{children}</pre>;
      const code = children.props.children;
      if (typeof code !== "string") return <pre>{children}</pre>;
      const language = /(?:^|\s)language-([^\s]+)/.exec(children.props.className ?? "")?.[1];
      return <CodeBlock code={code} language={language} appearance={appearance} />;
    },
    a({ node, ...props }) {
      void node;
      const target = openLinksInNewTab && Boolean(props.href && /^(?:https?:)?\/\//i.test(props.href)) ? "_blank" : undefined;
      const description = props["aria-describedby"]?.replace(/\bfootnote-label\b/g, `${id}-footnote-label`);
      return <a {...props} aria-describedby={description} target={target} rel={target ? "noopener noreferrer" : undefined} />;
    },
    h2({ node, ...props }) {
      void node;
      return <h2 {...props} id={props.id === "footnote-label" ? `${id}-footnote-label` : props.id} />;
    },
    img({ src, alt, title }) {
      if (!src) return alt ? <span>{alt}</span> : null;
      // This framework-independent library renders remote Markdown images natively.
      // eslint-disable-next-line @next/next/no-img-element
      return <img src={src} alt={alt ?? ""} title={title} loading="lazy" decoding="async" />;
    },
    table: ({ children }) => <div className="ui-markdown-table" role="region" aria-label="Table in message" tabIndex={0}><table>{children}</table></div>,
    th: ({ children, style }) => <th scope="col" style={style}>{children}</th>,
    ...components,
  };
  return <div className={uiClass("ui-markdown", className)} data-appearance={appearance}>
    <ReactMarkdown remarkPlugins={[remarkGfm]} remarkRehypeOptions={{ clobberPrefix: `${id}-` }} skipHtml urlTransform={defaultUrlTransform} components={renderers}>{content}</ReactMarkdown>
  </div>;
}

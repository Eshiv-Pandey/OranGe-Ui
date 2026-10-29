import { cleanup, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import { Markdown } from "../components/ui/markdown";

afterEach(cleanup);

describe("Markdown", () => {
  it("renders GFM structure, task items and a named scrolling table", () => {
    const content = "## Summary\n\nA **strong** result with ~~old~~ text.\n\n- [x] Read files\n- [ ] Review output\n\n| Name | Value |\n| --- | ---: |\n| Files | 3 |\n";
    const view = render(<Markdown content={content} />);
    expect(screen.getByRole("heading", { level: 2, name: "Summary" })).toBeInTheDocument();
    expect(view.container.querySelector("strong")).toHaveTextContent("strong");
    expect(screen.getByRole("checkbox", { name: "Read files" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Read files" })).toBeDisabled();
    expect(screen.getByRole("checkbox", { name: "Review output" })).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Review output" })).toBeDisabled();
    expect(screen.getByRole("region", { name: "Table in message" })).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("columnheader", { name: "Name" })).toHaveAttribute("scope", "col");
  });

  it("labels loose and nested tasks from their own visible text with unique references across messages", () => {
    const content = "- [ ] Review **output**\n\n  Check the result.\n\n  - [x] Read `files`\n\n- [ ] Publish changes";
    const view = render(<><Markdown content={content} /><Markdown content={content} /></>);
    expect(screen.getAllByRole("checkbox", { name: "Review output" })).toHaveLength(2);
    expect(screen.getAllByRole("checkbox", { name: "Read files" })).toHaveLength(2);
    expect(screen.getAllByRole("checkbox", { name: "Publish changes" })).toHaveLength(2);
    const labels = screen.getAllByRole("checkbox").map((checkbox) => {
      expect(checkbox).toBeDisabled();
      const labelId = checkbox.getAttribute("aria-labelledby");
      expect(labelId).toBeTruthy();
      expect(view.container.querySelectorAll(`[id="${labelId}"]`)).toHaveLength(1);
      return labelId;
    });
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("uses the shared CodeBlock for fenced code and keeps inline code in the paragraph", () => {
    const view = render(<Markdown content={'Use `answer` below.\n\n```ts\nconst answer = "<div>";\n```'} />);
    const block = screen.getByRole("region", { name: "Source code" });
    expect(block).toHaveTextContent('const answer = "<div>";');
    expect(block.querySelector("code")).toHaveAttribute("data-language", "ts");
    expect(view.container.querySelector("p code")).toHaveTextContent("answer");
    expect(view.container.querySelector("pre pre")).toBeNull();
    expect(screen.getByRole("button", { name: "Copy code" })).toBeInTheDocument();
  });

  it("omits raw HTML and strips executable link and image protocols", () => {
    const view = render(<Markdown content={'<script>alert("x")</script>\n\n[Unsafe](javascript:alert%281%29)\n\n![Unsafe image](data:text/html;base64,PHNjcmlwdD4=)'} />);
    expect(view.container.querySelector("script")).toBeNull();
    expect(view.container.querySelector('a[href^="javascript:"]')).toBeNull();
    expect(view.container.querySelector('img[src^="data:"]')).toBeNull();
    expect(view.container.querySelector('img[src=""]')).toBeNull();
  });

  it("preserves safe relative links and secures optional external blank targets", () => {
    render(<Markdown content="[Guide](/guide) and [Source](https://example.test/source)" openLinksInNewTab />);
    expect(screen.getByRole("link", { name: "Guide" })).toHaveAttribute("href", "/guide");
    expect(screen.getByRole("link", { name: "Guide" })).not.toHaveAttribute("target");
    expect(screen.getByRole("link", { name: "Source" })).toHaveAttribute("target", "_blank");
    expect(screen.getByRole("link", { name: "Source" })).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("names repeated footnotes uniquely across messages", () => {
    const content = "A reference.[^note]\n\n[^note]: Source note.";
    const view = render(<><Markdown content={content} /><Markdown content={content} /></>);
    const ids = Array.from(view.container.querySelectorAll("[id]"), (element) => element.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const anchor of view.container.querySelectorAll('a[href^="#"]')) {
      const target = anchor.getAttribute("href")!.slice(1);
      expect(ids).toContain(target);
    }
  });

  it("supports application-owned renderers and static server output", () => {
    const html = renderToStaticMarkup(<Markdown content="[Docs](/docs)" appearance="terminal" components={{ a: ({ href, children }) => <a href={href} data-router="app">{children}</a> }} />);
    expect(html).toContain('data-appearance="terminal"');
    expect(html).toContain('data-router="app"');
    expect(html).toContain('href="/docs"');
  });
});

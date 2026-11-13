"use client";

import Link from "next/link";
import { version } from "../../package.json";
import type { ReactNode } from "react";
import { components } from "../../lib/components";
import { DOC_SECTIONS, SIGNATURE_LINKS } from "../../lib/docs-navigation";
import { APPEARANCES } from "../ui/appearance";
import { useLibrary } from "./library-shell";
import "../../styles/docs-navigation.css";

export function GettingStarted({ serverAvatar }: { serverAvatar: ReactNode }) {
  const { href } = useLibrary();
  return <>
    <div className="library-heading docs-index-heading">
      <h1>Explore oRangeUi.</h1>
      <p>Start with our signature components, then bring the source into your React project.</p>
    </div>
    <ul className="docs-signature-index" aria-label="Signature components">
      {SIGNATURE_LINKS.map(entry => <li key={entry.id}><Link prefetch={false} href={entry.href.startsWith("/components/") ? href(entry.href) : entry.href}><strong>{entry.label}</strong><span>{entry.description}</span></Link></li>)}
    </ul>
    <nav className="docs-page-links" aria-label="On this page">
      <h2>On this page</h2>
      <div>{DOC_SECTIONS.map(section => <a key={section.id} href={`#${section.id}`}>{section.label}</a>)}</div>
    </nav>
    <div className="docs-content">
      <section id="installation">
        <h2>Install a component.</h2>
        <p>Open a component and try its preview. Copy its shadcn install command to add the source, styles and dependencies to your project. The registry puts files inside an orangeui/ folder, with runnable examples in orangeui/examples/.</p>
        <p>You can also download a ZIP containing the component, its local imports, styles, fonts and licenses. Source stays in your project, ready to read and change.</p>
        <Link className="text-link" prefetch={false} href={href("/components")}>Explore all {components.length} components</Link>
        <h3>Use your existing React app.</h3>
        <p>Use React 19 and TypeScript with a bundler that supports CSS imports, such as Next.js or Vite. React and React DOM are peer requirements of your app.</p>
        <p>The registry installs only the packages your selected component uses. For a ZIP, follow the included README. Common controls use these packages; creative components may have different dependencies:</p>
        <pre className="install-command" tabIndex={0}><code>npm install radix-ui @radix-ui/react-slot class-variance-authority zod react-markdown remark-gfm</code></pre>
      </section>
      <section id="source-structure">
        <h2>Keep the source together.</h2>
        <p>Copy <code>components/</code>, <code>lib/</code> when included, and <code>styles/</code> into the same folder, at your project root or under <code>src/</code>. Merge any included <code>public/</code> assets into your public folder. Keep <code>Example.tsx</code> beside the copied components folder so its relative imports resolve.</p>
        <pre className="install-command" tabIndex={0}><code>{"src/\n  components/ui/    # editable React components\n  lib/             # included component helpers\n  styles/          # component CSS and shared tokens\n  Example.tsx      # a runnable starting point\npublic/\n  fonts/           # included fonts and their licenses\n  photos/          # included photographs and their notices"}</code></pre>
        <p>Components import their own CSS. No Tailwind setup is required. For Next.js, import the example into a page; components with interaction already declare <code>&quot;use client&quot;</code>.</p>
      </section>
      <section id="appearances">
        <h2>Choose an appearance.</h2>
        <p>Core controls support five independent appearances. Many creative components are authored for a particular collection; check the component page for its supported appearance. Apply the same appearance to nested controls for a consistent composition.</p>
        <ul>{APPEARANCES.map(item => <li key={item.value}><code>appearance=&quot;{item.value}&quot;</code>: {item.description}</li>)}</ul>
        <pre className="install-command" tabIndex={0}><code>{'<Button appearance="neobrutalism">Make it bold</Button>\n<Button appearance="retro-os">Open a window</Button>\n<Button appearance="terminal">Run your idea</Button>'}</code></pre>
        <p>Appearance changes the control&apos;s geometry, typography and depth. Light and dark palettes are separate choices.</p>
      </section>
      <section id="theming">
        <h2>Two palettes. One foundation.</h2>
        <p>Use the Theme control in the docs header to choose an accent and copy readable light/dark CSS. Use the appearance picker for collection styling, and Ctrl+K or Command+K to find components, blocks and setup sections.</p>
        <p>Set <code>data-theme=&quot;light&quot;</code> or <code>data-theme=&quot;dark&quot;</code> on the HTML element. Without an explicit choice, the CSS follows the system palette. Put the theme on HTML so menus, dialogs and other portalled content inherit it too.</p>
        <pre className="install-command" tabIndex={0}><code>{'document.documentElement.dataset.theme = "dark";\n\n/* Override tokens after the component styles. */\n:root {\n  --primary: #ff6a00;\n  --primary-hover: #ff851a;\n  --on-primary: #171717;\n}\n[data-theme="dark"] {\n  --cream: #000000;\n  --surface: #0a0a0a;\n  --surface-soft: #171717;\n}'}</code></pre>
        <p>The dark workspace uses black with neutral gray surfaces and orange accents. Component artwork can carry its own palette.</p>
        <p>Font URLs begin at <code>/fonts/</code>. If your app runs under a base path, update the font-face URLs in <code>styles/library-base.css</code>. Preserve readable contrast when changing colors.</p>
      </section>
      <section id="accessibility">
        <h2>Keep the useful details.</h2>
        <p>Interactive overlays use Radix for focus management and keyboard behavior. Every component page includes specific keyboard guidance. Reduced motion is respected by the components, and GamerBoy supports keyboard or touch controls.</p>
        <p>Use real labels, meaningful button text and the appropriate heading level for your page. Previews are examples; connect callbacks to your own data and application behavior.</p>
      </section>
      <section id="infinite-avatar">
        <h2>An identity from a seed.</h2>
        <p>Infinite Avatar combines 64 curated gradients with 36 original SVG glyphs and subtle depth. A stable seed produces the same image on the server and client, without uploads, storage or network requests.</p>
        <div className="server-avatar-example">{serverAvatar}<p>This avatar is rendered by this page&apos;s Server Component, including when JavaScript is disabled.</p></div>
        <pre className="install-command" tabIndex={0}><code>{'import { Avatar } from "./components/ui/avatar";\n\n// Works directly in a synchronous Server Component.\n<Avatar seed="user-42" size="lg" appearance="polished" />'}</code></pre>
        <p>Pass a stable user ID as <code>seed</code>. All five appearances are supported. Pixelated uses a stepped SVG mask; the other appearances retain the squircle unless you select a different shape.</p>
        <h3>Customize once. Keep the JSON.</h3>
        <p><code>AvatarEditor</code> is controlled: it emits the new config through <code>onChange</code>. Save that small JSON object in your own database when the user chooses Save, then pass it back as <code>config</code>. A supplied config takes precedence over a seed. The editor itself never persists anything.</p>
        <pre className="install-command" tabIndex={0}><code>{'"use client";\nimport { useState } from "react";\nimport { AvatarEditor } from "./components/ui/avatar-editor";\nimport { Avatar } from "./components/ui/avatar";\nimport { generateAvatarConfig } from "./lib/avatar";\n\nexport function Profile() {\n  const [config, setConfig] = useState(() => generateAvatarConfig("user-42"));\n  return <>\n    <Avatar config={config} />\n    <AvatarEditor seed="user-42" value={config} onChange={setConfig} />\n  </>;\n}'}</code></pre>
        <h3>Export anywhere.</h3>
        <p>Use <code>avatarToSvgString(config, size)</code> or <code>avatarToDataUrl(config, size)</code> from <code>lib/avatar</code> on the server for emails and generated images. The optional browser helper <code>avatarToPng</code> from <code>lib/avatar/png</code> returns a PNG <code>Blob</code>. Root <code>index.ts</code> exports all components and helpers when using the full source repository. Avatar ZIPs include the core helpers and optional PNG leaf.</p>
        <Link className="text-link" prefetch={false} href={href("/components/avatar-editor")}>Make your own avatar</Link>
      </section>
      <section id="license">
        <h2>Yours to build with.</h2>
        <p>oRangeUi is MIT licensed. Keep the supplied license notices when redistributing source. Bundled fonts include their OFL license files, and photographs include their own source and license notices. Components with third-party sources retain their attribution and complete license notices.</p>
        <p>Emberling is an original SVG character, and the purple handheld is a working component.</p>
        <Link className="text-link" prefetch={false} href={href("/components/gamer-boy")}>Take GamerBoy for a spin</Link>
      </section>
      <section id="version">
        <h2>Version {version}</h2>
        <p>This catalogue and its install registry use the same source version. Installed components remain editable in your project.</p>
        <a className="text-link" href="https://github.com/Eshiv-Pandey/OranGe-Ui/blob/main/CHANGELOG.md">Read the changelog</a>
      </section>
    </div>
  </>;
}

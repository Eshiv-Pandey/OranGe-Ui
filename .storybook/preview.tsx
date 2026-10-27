import type { Preview } from "@storybook/react-vite";
import { useEffect, type ReactNode } from "react";
import "../styles/globals.css";
import "../styles/storybook-fonts.css";

function ThemeSurface({ palette, children }: { palette: string; children: ReactNode }) {
  useEffect(() => { document.documentElement.dataset.theme = palette; }, [palette]);
  return <main data-theme={palette} className="story-surface">{children}</main>;
}
const preview: Preview = {
  parameters: { layout: "padded", a11y: { test: "error" } },
  globalTypes: {
    palette: {
      description: "Palette",
      toolbar: { icon: "circlehollow", items: ["light", "dark"] },
    },
  },
  initialGlobals: { palette: "light" },
  decorators: [(Story, context) => <ThemeSurface palette={context.globals.palette}><Story /></ThemeSurface>],
};
export default preview;

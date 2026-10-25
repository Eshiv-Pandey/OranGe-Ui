import type { Preview } from "@storybook/react-vite";
import "../styles/globals.css";
import "../styles/storybook-fonts.css";

const preview: Preview = {
  parameters: { layout: "padded", a11y: { test: "error" } },
  globalTypes: {
    palette: {
      description: "Palette",
      toolbar: { icon: "circlehollow", items: ["light", "dark"] },
    },
  },
  initialGlobals: { palette: "light" },
  decorators: [(Story, context) => <main data-theme={context.globals.palette} className="story-surface"><Story /></main>],
};
export default preview;

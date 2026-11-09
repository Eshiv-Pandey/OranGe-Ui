import type { Meta, StoryObj } from "@storybook/react-vite";
import { PavilionFooter } from "../components/ui/pavilion-footer";
const meta = { title: "Library/PavilionFooter", component: PavilionFooter, parameters: { layout: "fullscreen" } } satisfies Meta<typeof PavilionFooter>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Blue: Story = {};
export const Pixel: Story = { args: { pixelated: true } };
export const Lit: Story = { args: { defaultLit: true } };

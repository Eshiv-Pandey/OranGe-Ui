import type { Meta, StoryObj } from "@storybook/react-vite";
import { NeonSign404 } from "../components/ui/neon-sign-404";
const meta = { title: "Library/NeonSign404", component: NeonSign404, parameters: { layout: "centered" }, args: { digits: "404", glow: .8, flicker: true, size: "md" } } satisfies Meta<typeof NeonSign404>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Diner: Story = {};
export const Open: Story = { args: { digits: "OPEN", color: "#ff65ad", borderColor: "#58bcff" } };
export const Pixel: Story = { args: { pixelated: true } };

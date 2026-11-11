import type { Meta, StoryObj } from "@storybook/react-vite";
import { ChaiBreak404 } from "../components/ui/chai-break-404";
const meta = { title: "Library/ChaiBreak404", component: ChaiBreak404, parameters: { layout: "fullscreen" }, args: { speed: 1, grain: .035 } } satisfies Meta<typeof ChaiBreak404>;
export default meta;
type Story = StoryObj<typeof meta>;
export const ChaiBreak: Story = {};
export const SlowPour: Story = { args: { speed: .5 } };

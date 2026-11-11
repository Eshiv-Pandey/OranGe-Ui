import type { Meta, StoryObj } from "@storybook/react-vite";
import { WallSwitch } from "../components/ui/wall-switch";
const meta = { title: "Library/WallSwitch", component: WallSwitch, args: { label: "Studio light" } } satisfies Meta<typeof WallSwitch>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Off: Story = {};
export const On: Story = { args: { defaultChecked: true } };
export const Disabled: Story = { args: { disabled: true } };

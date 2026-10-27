import type { Meta, StoryObj } from "@storybook/react-vite";
import { ComponentDemo } from "../components/library/component-demo";
import "../styles/library.css";
const meta = { title: "Library/DropdownMenu", component: ComponentDemo, args: { slug: "dropdown-menu", appearance: "polished" }, render: (args) => <div className="detail-demo demo-dropdown-menu" style={{ maxWidth: 760 }}><ComponentDemo {...args} /></div> } satisfies Meta<typeof ComponentDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Polished: Story = {};
export const Pixelated: Story = { args: { appearance: "pixel" } };

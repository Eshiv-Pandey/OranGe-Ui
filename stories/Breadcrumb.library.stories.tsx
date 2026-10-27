import type { Meta, StoryObj } from "@storybook/react-vite";
import { ComponentDemo } from "../components/library/component-demo";
import "../styles/library.css";
const meta = { title: "Library/Breadcrumb", component: ComponentDemo, args: { slug: "breadcrumb", appearance: "polished" }, render: (args) => <div className="detail-demo demo-breadcrumb" style={{ maxWidth: 760 }}><ComponentDemo {...args} /></div> } satisfies Meta<typeof ComponentDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Polished: Story = {};
export const Pixelated: Story = { args: { appearance: "pixel" } };

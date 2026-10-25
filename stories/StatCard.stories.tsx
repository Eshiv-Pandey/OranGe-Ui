import type { Meta, StoryObj } from "@storybook/react-vite";
import { StatCard } from "../components/ui/stat-card";

const meta = { title: "Components/StatCard", component: StatCard, args: { accent: "lime", counter: "01 / 05", art: <span className="pixel-type" style={{ fontSize: 72 }}>01</span>, title: "Button", subtitle: "Small details. Solid foundations.", stats: [{ label: "Variants", value: 3 }, { label: "States", value: 6 }], footer: "Ready to use" }, decorators: [(Story) => <div style={{ maxWidth: 280 }}><Story /></div>] } satisfies Meta<typeof StatCard>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Linked: Story = { args: { href: "#details" } };
export const LongText: Story = { args: { title: "A thoughtfully crafted component", subtitle: "Supporting text stays readable even when a project has a much longer description.", stats: [{ label: "Total completed interactions", value: "1,024,512" }, { label: "Keyboard accessible states", value: 6 }], footer: "Every small detail is considered" } };
export const Narrow: Story = { decorators: [(Story) => <div style={{ width: 184 }}><Story /></div>], args: { href: "#details", title: "Small space", subtitle: "A narrow card still has room to breathe." } };
export const AllAccents: Story = { decorators: [(Story) => <div style={{ width: "min(1200px, 90vw)", maxWidth: "none" }}><Story /></div>], render: (args) => <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 24 }}>{(["lime", "mint", "amber", "sky", "coral"] as const).map((accent, index) => <StatCard {...args} key={accent} accent={accent} counter={`0${index + 1} / 05`} title={accent} href={index % 2 ? "#details" : undefined} />)}</div> };

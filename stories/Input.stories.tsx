import type { Meta, StoryObj } from "@storybook/react-vite";
import { Input } from "../components/ui/input";

const searchIcon = <svg viewBox="0 0 20 20" fill="currentColor"><path d="M4 2h8v2H4zM2 4h2v8H2zM12 4h2v8h-2zM4 12h8v2H4zM12 12h2v2h-2zM14 14h2v2h-2zM16 16h2v2h-2z" /></svg>;
const meta = {
  title: "Components/Input",
  component: Input,
  args: { label: "Your name", placeholder: "Enter your name" },
} satisfies Meta<typeof Input>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithIcon: Story = { args: { label: "Search components", placeholder: "Search components...", icon: searchIcon } };
export const Error: Story = { args: { label: "Email", type: "email", defaultValue: "hello", error: "Enter a valid email address.", description: "Use the address where you receive updates." } };
export const Disabled: Story = { args: { disabled: true, defaultValue: "Not available" } };
export const Loading: Story = { args: { label: "Search", icon: searchIcon, loading: true, defaultValue: "button" } };
export const ReadOnly: Story = { args: { label: "Project", value: "oRangeUi", readOnly: true } };
export const HiddenLabel: Story = { args: { label: "Search components", hideLabel: true, icon: searchIcon, placeholder: "Search components..." } };
export const AllStates: Story = {
  render: () => <div style={{ display: "grid", gap: 32, maxWidth: 480 }}>
    <Input label="Your name" placeholder="Enter your name" description="A short name works best." />
    <Input label="Search components" placeholder="Search components..." icon={searchIcon} />
    <Input label="Email" type="email" defaultValue="hello" error="Enter a valid email address." required />
    <Input label="Read only" value="oRangeUi" readOnly />
    <Input label="Unavailable" disabled defaultValue="Not available" />
    <Input label="Searching" loading icon={searchIcon} defaultValue="button" />
  </div>,
};

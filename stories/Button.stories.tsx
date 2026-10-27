import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../components/ui/button";

const meta = {
  title: "Components/Button",
  component: Button,
  args: { children: "Get started" },
  argTypes: { variant: { control: "select", options: ["primary", "secondary", "ghost"] } },
} satisfies Meta<typeof Button>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};
export const Secondary: Story = { args: { variant: "secondary", children: "View components" } };
export const Ghost: Story = { args: { variant: "ghost", children: "Learn more" } };
export const Loading: Story = { args: { loading: true, children: "Saving changes" } };
export const Disabled: Story = { args: { disabled: true, children: "Unavailable" } };
export const AsLink: Story = { args: { asChild: true, children: <a href="#destination">View components</a> } };
export const LoadingLink: Story = { args: { asChild: true, loading: true, children: <a href="#destination">Opening components</a> } };
export const WithIcon: Story = { args: { children: <><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>Add component</> } };
export const AllStates: Story = {
  render: () => <div style={{ display: "grid", gap: 32 }}>
    <p>Tab to inspect focus. Hover and press enabled controls to inspect their tactile states.</p>
    {(["primary", "secondary", "ghost"] as const).map((variant) => <div key={variant} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 24 }}>
      <Button variant={variant}>{variant} action</Button>
      <Button variant={variant} disabled>Unavailable</Button>
      <Button variant={variant} loading>Saving changes</Button>
    </div>)}
    <Button asChild><a href="#destination">Linked action</a></Button>
    <Button asChild disabled><a href="#destination">Unavailable link</a></Button>
    <Button asChild loading><a href="#destination">Opening components</a></Button>
    <span id="destination">Link destination</span>
  </div>,
};
